import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { assessmentFields, assessmentObject } from './schema'
import { assessmentSchema, validateWeight, validateWithSchema } from './validation'

/**
 * Create a new assessment
 */
export const createAssessment = mutation({
  args: {
    name: assessmentFields.name,
    icon: assessmentFields.icon,
    contribution: assessmentFields.contribution,
    weight: assessmentFields.weight,
    description: assessmentFields.description,
    dueDate: assessmentFields.dueDate,
    userId: assessmentFields.userId,
    subjectId: assessmentFields.subjectId,
  },
  returns: v.id('assessments'),
  handler: async (ctx, args) => {
    // Validate input using composite schema
    const validation = validateWithSchema(assessmentSchema, args)

    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    // Check if user and subject exist
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    const subject = await ctx.db.get(args.subjectId)
    if (!subject) {
      throw new Error('Subject not found')
    }

    // Check if subject belongs to user
    if (subject.userId !== args.userId) {
      throw new Error('Subject does not belong to this user')
    }

    // Validate total weight doesn't exceed 100% for the subject
    const existingAssessments = await ctx.db
      .query('assessments')
      .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId))
      .collect()

    const existingWeights = existingAssessments.map((a) => a.weight)
    const weightValidation = validateWeight(validation.data.weight, existingWeights)
    if (!weightValidation.isValid) {
      throw new Error(weightValidation.error!)
    }

    return await ctx.db.insert('assessments', {
      ...validation.data,
      complete: false,
      showCheckAlert: true,
      userId: args.userId,
      subjectId: args.subjectId,
    })
  },
})

/**
 * Get all assessments for a user
 */
export const getAssessmentsByUser = query({
  args: {
    userId: assessmentFields.userId,
    includeCompleted: v.optional(assessmentFields.complete),
  },
  returns: v.array(assessmentObject),
  handler: async (ctx, args) => {
    const includeCompleted = args.includeCompleted ?? true

    if (includeCompleted) {
      return await ctx.db
        .query('assessments')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .order('desc')
        .collect()
    } else {
      return await ctx.db
        .query('assessments')
        .withIndex('by_user_and_complete', (q) => q.eq('userId', args.userId).eq('complete', false))
        .order('desc')
        .collect()
    }
  },
})

/**
 * Get assessments by subject
 */
export const getAssessmentsBySubject = query({
  args: {
    subjectId: assessmentFields.subjectId,
    includeCompleted: v.optional(assessmentFields.complete),
  },
  returns: v.array(assessmentObject),
  handler: async (ctx, args) => {
    const includeCompleted = args.includeCompleted ?? true

    if (includeCompleted) {
      return await ctx.db
        .query('assessments')
        .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId))
        .order('desc')
        .collect()
    } else {
      return await ctx.db
        .query('assessments')
        .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId))
        .filter((q) => q.eq(q.field('complete'), false))
        .order('desc')
        .collect()
    }
  },
})

/**
 * Get assessments due within a specified time range
 */
export const getUpcomingAssessments = query({
  args: {
    userId: assessmentFields.userId,
    daysAhead: v.optional(v.number()),
  },
  returns: v.array(assessmentObject),
  handler: async (ctx, args) => {
    const daysAhead = args.daysAhead ?? 14 // Default to 14 days
    const now = Date.now()
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000

    return await ctx.db
      .query('assessments')
      .withIndex('by_user_and_due_date', (q) =>
        q.eq('userId', args.userId).gte('dueDate', now).lte('dueDate', futureDate),
      )
      .filter((q) => q.eq(q.field('complete'), false))
      .order('asc')
      .collect()
  },
})

/**
 * Get a single assessment by ID
 */
export const getAssessmentById = query({
  args: {
    assessmentId: v.id('assessments'),
  },
  returns: v.union(assessmentObject, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assessmentId)
  },
})

/**
 * Update an assessment
 */
export const updateAssessment = mutation({
  args: {
    assessmentId: v.id('assessments'),
    name: v.optional(assessmentFields.name),
    icon: v.optional(assessmentFields.icon),
    contribution: v.optional(assessmentFields.contribution),
    weight: v.optional(assessmentFields.weight),
    description: v.optional(assessmentFields.description),
    dueDate: v.optional(assessmentFields.dueDate),
    complete: v.optional(assessmentFields.complete),
    showCheckAlert: v.optional(assessmentFields.showCheckAlert),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    // Validate using composite schema (only validate fields that are being updated)
    const validation = validateWithSchema(assessmentSchema.partial(), args)
    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    // Validate weight if it's being updated
    if (validation.data.weight !== undefined) {
      const existingAssessments = await ctx.db
        .query('assessments')
        .withIndex('by_subject', (q) => q.eq('subjectId', assessment.subjectId))
        .filter((q) => q.neq(q.field('_id'), args.assessmentId))
        .collect()

      const existingWeights = existingAssessments.map((a) => a.weight)
      const weightValidation = validateWeight(validation.data.weight, existingWeights)
      if (!weightValidation.isValid) {
        throw new Error(weightValidation.error!)
      }
    }

    await ctx.db.patch(args.assessmentId, validation.data)
    return null
  },
})

/**
 * Delete an assessment and all related data
 */
export const deleteAssessment = mutation({
  args: {
    assessmentId: v.id('assessments'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    // Delete assessment grades
    const grades = await ctx.db
      .query('assessmentGrades')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .collect()

    for (const grade of grades) {
      await ctx.db.delete(grade._id)
    }

    // Delete assessment tasks
    const tasks = await ctx.db
      .query('assessmentTasks')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .collect()

    for (const task of tasks) {
      await ctx.db.delete(task._id)
    }

    // Delete the assessment
    await ctx.db.delete(args.assessmentId)
    return null
  },
})

/**
 * Toggle assessment completion status
 */
export const toggleAssessmentComplete = mutation({
  args: {
    assessmentId: v.id('assessments'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    await ctx.db.patch(args.assessmentId, {
      complete: !assessment.complete,
    })
    return null
  },
})
