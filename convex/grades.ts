import { ConvexError, v } from 'convex/values'
import { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { requireAuth, requireAuthAndOwnership } from './authHelpers'
import { gradeFields, gradeObject } from './schema'
import { gradeSchema, validateGradeTotal, validateWithSchema } from './validation'

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

    // Get existing grades for this assessment to check total
    const existingGrades = await ctx.db
      .query('grades')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .collect()

    const existingGradeValues = existingGrades.map((g) => g.grade)
    const gradeValidation = validateGradeTotal(
      validation.data.grade,
      existingGradeValues,
      (assessment as Doc<'assessments'>).weight,
    )

    if (!gradeValidation.isValid) {
      throw new ConvexError(gradeValidation.error!)
    }

    const gradeId = await ctx.db.insert('grades', {
      ...validation.data,
      userId,
      subjectId: (assessment as Doc<'assessments'>).subjectId,
      assessmentId: args.assessmentId,
    })

    return gradeId
  },
})

/**
 * Get all grades for a user
 */
export const getGradesByUser = query({
  args: {
    subjectId: v.optional(v.id('subjects')),
  },
  returns: v.array(gradeObject),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const hasSubjectFilter = !!args.subjectId

    let results
    results = ctx.db.query('grades').withIndex('by_user', (q) => q.eq('userId', userId))

    // Apply subject filter
    if (hasSubjectFilter) {
      results = results.filter((q) => q.eq(q.field('subjectId'), args.subjectId))
    }

    return await results.collect()
  },
})

/**
 * Get all grades for an assessment
 */
export const getGradesByAssessment = query({
  args: {
    assessmentId: v.id('assessments'),
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

    // If grade is being updated, validate total doesn't exceed assessment weight
    if (validation.data.grade !== undefined) {
      // Get the assessment to check its weight
      const assessment = await ctx.db.get(gradeRecord.assessmentId)
      if (!assessment) {
        throw new ConvexError('Assessment not found')
      }

      // Get existing grades for this assessment (excluding the current one)
      const existingGrades = await ctx.db
        .query('grades')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', gradeRecord.assessmentId))
        .filter((q) => q.neq(q.field('_id'), args.gradeId))
        .collect()

      const existingGradeValues = existingGrades.map((g) => g.grade)
      const gradeValidation = validateGradeTotal(validation.data.grade, existingGradeValues, assessment.weight)

      if (!gradeValidation.isValid) {
        throw new ConvexError(gradeValidation.error!)
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
    gradeId: v.id('grades'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthAndOwnership(ctx, args.gradeId)
    await ctx.db.delete(args.gradeId)
  },
})
