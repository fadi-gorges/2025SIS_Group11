import { v } from 'convex/values'
import { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'

// Assessment validation constants
const ASSESSMENT_NAME_MAX_LENGTH = 75
const ASSESSMENT_TASK_MAX_LENGTH = 2000

// Valid assessment icons
const VALID_ICONS = ['📝', '📚', '🎤', '💻', '🎨', '🧪', '🌐', '🎭'] as const
type ValidIcon = (typeof VALID_ICONS)[number]

/**
 * Create a new assessment
 */
export const createAssessment = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    contribution: v.union(v.literal('individual'), v.literal('group')),
    weight: v.number(),
    task: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    userId: v.id('users'),
    subjectId: v.id('subjects'),
  },
  returns: v.id('assessments'),
  handler: async (ctx, args) => {
    // Validate input
    if (args.name.length === 0 || args.name.length > ASSESSMENT_NAME_MAX_LENGTH) {
      throw new Error(`Assessment name must be between 1 and ${ASSESSMENT_NAME_MAX_LENGTH} characters`)
    }

    if (!VALID_ICONS.includes(args.icon as ValidIcon)) {
      throw new Error('Invalid icon selected')
    }

    if (args.weight < 0 || args.weight > 100) {
      throw new Error('Weight must be between 0 and 100')
    }

    if (args.task && args.task.length > ASSESSMENT_TASK_MAX_LENGTH) {
      throw new Error(`Task description must be no more than ${ASSESSMENT_TASK_MAX_LENGTH} characters`)
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

    const totalExistingWeight = existingAssessments.reduce((sum, assessment) => sum + assessment.weight, 0)
    if (totalExistingWeight + args.weight > 100) {
      throw new Error(`Total weight would exceed 100%. Current total: ${totalExistingWeight}%`)
    }

    return await ctx.db.insert('assessments', {
      name: args.name.trim(),
      icon: args.icon,
      contribution: args.contribution,
      weight: args.weight,
      task: args.task?.trim(),
      dueDate: args.dueDate,
      complete: false,
      showCheckAlert: false,
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
    userId: v.id('users'),
    includeCompleted: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id('assessments'),
      _creationTime: v.number(),
      name: v.string(),
      icon: v.string(),
      contribution: v.union(v.literal('individual'), v.literal('group')),
      weight: v.number(),
      task: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      complete: v.boolean(),
      showCheckAlert: v.boolean(),
      userId: v.id('users'),
      subjectId: v.id('subjects'),
    }),
  ),
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
    subjectId: v.id('subjects'),
    includeCompleted: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id('assessments'),
      _creationTime: v.number(),
      name: v.string(),
      icon: v.string(),
      contribution: v.union(v.literal('individual'), v.literal('group')),
      weight: v.number(),
      task: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      complete: v.boolean(),
      showCheckAlert: v.boolean(),
      userId: v.id('users'),
      subjectId: v.id('subjects'),
    }),
  ),
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
    userId: v.id('users'),
    daysAhead: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('assessments'),
      _creationTime: v.number(),
      name: v.string(),
      icon: v.string(),
      contribution: v.union(v.literal('individual'), v.literal('group')),
      weight: v.number(),
      task: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      complete: v.boolean(),
      showCheckAlert: v.boolean(),
      userId: v.id('users'),
      subjectId: v.id('subjects'),
    }),
  ),
  handler: async (ctx, args) => {
    const daysAhead = args.daysAhead ?? 7 // Default to 7 days
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
  returns: v.union(
    v.object({
      _id: v.id('assessments'),
      _creationTime: v.number(),
      name: v.string(),
      icon: v.string(),
      contribution: v.union(v.literal('individual'), v.literal('group')),
      weight: v.number(),
      task: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      complete: v.boolean(),
      showCheckAlert: v.boolean(),
      userId: v.id('users'),
      subjectId: v.id('subjects'),
    }),
    v.null(),
  ),
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
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    contribution: v.optional(v.union(v.literal('individual'), v.literal('group'))),
    weight: v.optional(v.number()),
    task: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    complete: v.optional(v.boolean()),
    showCheckAlert: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    const updateData: Partial<Doc<'assessments'>> = {}

    // Validate and update fields
    if (args.name !== undefined) {
      if (args.name.length === 0 || args.name.length > ASSESSMENT_NAME_MAX_LENGTH) {
        throw new Error(`Assessment name must be between 1 and ${ASSESSMENT_NAME_MAX_LENGTH} characters`)
      }
      updateData.name = args.name.trim()
    }

    if (args.icon !== undefined) {
      if (!VALID_ICONS.includes(args.icon as ValidIcon)) {
        throw new Error('Invalid icon selected')
      }
      updateData.icon = args.icon
    }

    if (args.contribution !== undefined) {
      updateData.contribution = args.contribution
    }

    if (args.weight !== undefined) {
      if (args.weight < 0 || args.weight > 100) {
        throw new Error('Weight must be between 0 and 100')
      }

      // Validate total weight doesn't exceed 100% for the subject
      const existingAssessments = await ctx.db
        .query('assessments')
        .withIndex('by_subject', (q) => q.eq('subjectId', assessment.subjectId))
        .filter((q) => q.neq(q.field('_id'), args.assessmentId))
        .collect()

      const totalExistingWeight = existingAssessments.reduce((sum, a) => sum + a.weight, 0)
      if (totalExistingWeight + args.weight > 100) {
        throw new Error(
          `Total weight would exceed 100%. Current total without this assessment: ${totalExistingWeight}%`,
        )
      }

      updateData.weight = args.weight
    }

    if (args.task !== undefined) {
      if (args.task.length > ASSESSMENT_TASK_MAX_LENGTH) {
        throw new Error(`Task description must be no more than ${ASSESSMENT_TASK_MAX_LENGTH} characters`)
      }
      updateData.task = args.task.trim() || undefined
    }

    if (args.dueDate !== undefined) {
      updateData.dueDate = args.dueDate
    }

    if (args.complete !== undefined) {
      updateData.complete = args.complete
    }

    if (args.showCheckAlert !== undefined) {
      updateData.showCheckAlert = args.showCheckAlert
    }

    await ctx.db.patch(args.assessmentId, updateData)
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
