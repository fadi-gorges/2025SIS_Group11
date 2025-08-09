import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuthAndOwnership } from './authHelpers'
import { assessmentGradeFields, assessmentGradeObject } from './schema'
import { assessmentGradeSchema, validateWithSchema } from './validation'

/**
 * Add a grade to an assessment
 */
export const addGrade = mutation({
  args: {
    name: assessmentGradeFields.name,
    grade: assessmentGradeFields.grade,
    assessmentId: assessmentGradeFields.assessmentId,
  },
  returns: v.id('assessmentGrades'),
  handler: async (ctx, args) => {
    // Validate input using composite schema
    const validation = validateWithSchema(assessmentGradeSchema, args)

    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    // Check if assessment exists and belongs to user
    const { userId } = await requireAuthAndOwnership(ctx, args.assessmentId)

    // Check for duplicate grade name within the assessment
    const existingGrade = await ctx.db
      .query('assessmentGrades')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .filter((q) => q.eq(q.field('name'), validation.data.name))
      .first()

    if (existingGrade) {
      throw new ConvexError('A grade with this name already exists for this assessment')
    }

    return await ctx.db.insert('assessmentGrades', {
      ...validation.data,
      userId,
      assessmentId: args.assessmentId,
    })
  },
})

/**
 * Get all grades for an assessment
 */
export const getGradesByAssessment = query({
  args: {
    assessmentId: assessmentGradeFields.assessmentId,
  },
  returns: v.array(assessmentGradeObject),
  handler: async (ctx, args) => {
    // Check if assessment belongs to user
    await requireAuthAndOwnership(ctx, args.assessmentId)

    return await ctx.db
      .query('assessmentGrades')
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
    gradeId: v.id('assessmentGrades'),
    name: v.optional(assessmentGradeFields.name),
    grade: v.optional(assessmentGradeFields.grade),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { data: gradeRecord } = await requireAuthAndOwnership(ctx, args.gradeId)

    // Validate using composite schema (only validate fields that are being updated)
    const validation = validateWithSchema(assessmentGradeSchema.partial(), args)
    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    if (validation.data.name !== undefined) {
      // Check for duplicate name (excluding current grade)
      const existingGrade = await ctx.db
        .query('assessmentGrades')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', gradeRecord.assessmentId))
        .filter((q) => q.and(q.eq(q.field('name'), validation.data.name), q.neq(q.field('_id'), args.gradeId)))
        .first()

      if (existingGrade) {
        throw new ConvexError('A grade with this name already exists for this assessment')
      }
    }

    await ctx.db.patch(args.gradeId, validation.data)
  },
})

/**
 * Delete a grade
 */
export const deleteGrade = mutation({
  args: {
    gradeId: v.id('assessmentGrades'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthAndOwnership(ctx, args.gradeId)
    await ctx.db.delete(args.gradeId)
  },
})
