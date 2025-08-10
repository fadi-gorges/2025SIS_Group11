import { ConvexError, v } from 'convex/values'
import { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { requireAuthAndOwnership } from './authHelpers'
import { gradeFields, gradeObject } from './schema'
import { gradeSchema, validateWithSchema } from './validation'

/**
 * Add a grade to an assessment
 */
export const addGrade = mutation({
  args: {
    name: gradeFields.name,
    grade: gradeFields.grade,
    assessmentId: gradeFields.assessmentId,
  },
  returns: v.id('grades'),
  handler: async (ctx, args) => {
    // Validate input using composite schema
    const validation = validateWithSchema(gradeSchema, args)

    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    // Check if assessment exists and belongs to user
    const { userId, data: assessment } = await requireAuthAndOwnership(ctx, args.assessmentId)

    const existingGrades = await ctx.db
      .query('grades')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .collect()

    const gradeId = await ctx.db.insert('grades', {
      ...validation.data,
      userId,
      subjectId: (assessment as Doc<'assessments'>).subjectId,
      assessmentId: args.assessmentId,
    })

    // Update subject total grade
    await ctx.db.patch(assessment.subjectId, {
      totalGrade: existingGrades.reduce((sum, g) => sum + g.grade, 0) + validation.data.grade,
    })

    return gradeId
  },
})

/**
 * Get all grades for an assessment
 */
export const getGradesByAssessment = query({
  args: {
    assessmentId: gradeFields.assessmentId,
  },
  returns: v.array(gradeObject),
  handler: async (ctx, args) => {
    // Check if assessment belongs to user
    await requireAuthAndOwnership(ctx, args.assessmentId)

    return await ctx.db
      .query('grades')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .order('desc')
      .collect()
  },
})

/**
 * Update a grade
 */
export const updateGrade = mutation({
  args: {
    gradeId: v.id('grades'),
    name: v.optional(gradeFields.name),
    grade: v.optional(gradeFields.grade),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { data: gradeRecord } = await requireAuthAndOwnership(ctx, args.gradeId)

    // Validate using composite schema (only validate fields that are being updated)
    const validation = validateWithSchema(gradeSchema.partial(), args)
    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    if (validation.data.name !== undefined) {
      // Check for duplicate name (excluding current grade)
      const existingGrade = await ctx.db
        .query('grades')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', gradeRecord.assessmentId))
        .filter((q) => q.and(q.eq(q.field('name'), validation.data.name), q.neq(q.field('_id'), args.gradeId)))
        .first()

      if (existingGrade) {
        throw new ConvexError('A grade with this name already exists for this assessment')
      }
    }

    await ctx.db.patch(args.gradeId, validation.data)

    // Update subject total grade if grade value was changed
    if (validation.data.grade !== undefined) {
      const allGrades = await ctx.db
        .query('grades')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', gradeRecord.assessmentId))
        .collect()

      // Find the updated grade in the collection and use its new value
      const totalGrade = allGrades.reduce((sum, g) => {
        if (g._id === args.gradeId) {
          return sum + validation.data.grade!
        }
        return sum + g.grade
      }, 0)

      await ctx.db.patch(gradeRecord.subjectId, { totalGrade })
    }
  },
})

/**
 * Delete a grade
 */
export const deleteGrade = mutation({
  args: {
    gradeId: v.id('grades'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { data: gradeRecord } = await requireAuthAndOwnership(ctx, args.gradeId)

    await ctx.db.delete(args.gradeId)

    // Update subject total grade after deletion
    const remainingGrades = await ctx.db
      .query('grades')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', gradeRecord.assessmentId))
      .collect()

    const totalGrade = remainingGrades.reduce((sum, g) => sum + g.grade, 0)

    await ctx.db.patch(gradeRecord.subjectId, { totalGrade })
  },
})
