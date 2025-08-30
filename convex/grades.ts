import { ConvexError, v } from 'convex/values'
import { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { requireAuthAndOwnership } from './authHelpers'
import { gradeFields, gradeObject } from './schema'
import { gradeSchema, validateWithSchema } from './validation'

/**
 * Helper function to calculate and update subject total grade
 */
async function updateSubjectTotalGrade(ctx: any, subjectId: string) {
  const allAssessments = await ctx.db
    .query('assessments')
    .withIndex('by_subject', (q: any) => q.eq('subjectId', subjectId))
    .collect()

  let totalWeightedGrade = 0
  let totalWeight = 0

  for (const assmt of allAssessments) {
    const assessmentGrades = await ctx.db
      .query('grades')
      .withIndex('by_assessment', (q: any) => q.eq('assessmentId', assmt._id))
      .collect()

    if (assessmentGrades.length > 0) {
      // Calculate average grade for this assessment
      const avgGrade = assessmentGrades.reduce((sum: number, g: any) => sum + g.grade, 0) / assessmentGrades.length
      totalWeightedGrade += avgGrade * assmt.weight
      totalWeight += assmt.weight
    }
  }

  // Calculate final weighted average
  const finalGrade = totalWeight > 0 ? totalWeightedGrade / totalWeight : 0

  await ctx.db.patch(subjectId, { totalGrade: finalGrade })
}

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

    // Update subject total grade using helper function
    await updateSubjectTotalGrade(ctx, assessment.subjectId)

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
      await updateSubjectTotalGrade(ctx, gradeRecord.subjectId)
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
    await updateSubjectTotalGrade(ctx, gradeRecord.subjectId)
  },
})
