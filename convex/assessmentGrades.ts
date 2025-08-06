import { v } from 'convex/values'
import { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'

// Grade validation constants
const GRADE_NAME_MAX_LENGTH = 75

/**
 * Add a grade to an assessment
 */
export const addGrade = mutation({
  args: {
    assessmentId: v.id('assessments'),
    name: v.string(),
    grade: v.number(),
  },
  returns: v.id('assessmentGrades'),
  handler: async (ctx, args) => {
    // Validate input
    if (args.name.length === 0 || args.name.length > GRADE_NAME_MAX_LENGTH) {
      throw new Error(`Grade name must be between 1 and ${GRADE_NAME_MAX_LENGTH} characters`)
    }

    if (args.grade < 0 || args.grade > 100) {
      throw new Error('Grade must be between 0 and 100')
    }

    // Check if assessment exists
    const assessment = await ctx.db.get(args.assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    // Check for duplicate grade name within the assessment
    const existingGrade = await ctx.db
      .query('assessmentGrades')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .filter((q) => q.eq(q.field('name'), args.name))
      .first()

    if (existingGrade) {
      throw new Error('A grade with this name already exists for this assessment')
    }

    return await ctx.db.insert('assessmentGrades', {
      assessmentId: args.assessmentId,
      name: args.name.trim(),
      grade: args.grade,
    })
  },
})

/**
 * Get all grades for an assessment
 */
export const getGradesByAssessment = query({
  args: {
    assessmentId: v.id('assessments'),
  },
  returns: v.array(
    v.object({
      _id: v.id('assessmentGrades'),
      _creationTime: v.number(),
      assessmentId: v.id('assessments'),
      name: v.string(),
      grade: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
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
    name: v.optional(v.string()),
    grade: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const gradeRecord = await ctx.db.get(args.gradeId)
    if (!gradeRecord) {
      throw new Error('Grade not found')
    }

    const updateData: Partial<Doc<'assessmentGrades'>> = {}

    if (args.name !== undefined) {
      if (args.name.length === 0 || args.name.length > GRADE_NAME_MAX_LENGTH) {
        throw new Error(`Grade name must be between 1 and ${GRADE_NAME_MAX_LENGTH} characters`)
      }

      // Check for duplicate name (excluding current grade)
      const existingGrade = await ctx.db
        .query('assessmentGrades')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', gradeRecord.assessmentId))
        .filter((q) => q.and(q.eq(q.field('name'), args.name), q.neq(q.field('_id'), args.gradeId)))
        .first()

      if (existingGrade) {
        throw new Error('A grade with this name already exists for this assessment')
      }

      updateData.name = args.name.trim()
    }

    if (args.grade !== undefined) {
      if (args.grade < 0 || args.grade > 100) {
        throw new Error('Grade must be between 0 and 100')
      }
      updateData.grade = args.grade
    }

    await ctx.db.patch(args.gradeId, updateData)
    return null
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
    const grade = await ctx.db.get(args.gradeId)
    if (!grade) {
      throw new Error('Grade not found')
    }

    await ctx.db.delete(args.gradeId)
    return null
  },
})

/**
 * Calculate average grade for an assessment
 */
export const getAverageGrade = query({
  args: {
    assessmentId: v.id('assessments'),
  },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    const grades = await ctx.db
      .query('assessmentGrades')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .collect()

    if (grades.length === 0) {
      return null
    }

    const total = grades.reduce((sum, grade) => sum + grade.grade, 0)
    return Math.round((total / grades.length) * 100) / 100 // Round to 2 decimal places
  },
})
