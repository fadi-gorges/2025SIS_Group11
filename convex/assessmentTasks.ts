import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { assessmentTaskFields, assessmentTaskObject } from './schema'
import { assessmentTaskSchema, validateWithSchema } from './validation'

/**
 * Add a task to an assessment
 */
export const addTask = mutation({
  args: assessmentTaskFields,
  returns: v.id('assessmentTasks'),
  handler: async (ctx, args) => {
    // Validate input using composite schema
    const validation = validateWithSchema(assessmentTaskSchema, args)

    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    // Check if assessment exists
    const assessment = await ctx.db.get(args.assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    return await ctx.db.insert('assessmentTasks', {
      ...validation.data,
      assessmentId: args.assessmentId,
    })
  },
})

/**
 * Get all tasks for an assessment
 */
export const getTasksByAssessment = query({
  args: {
    assessmentId: assessmentTaskFields.assessmentId,
  },
  returns: v.array(assessmentTaskObject),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('assessmentTasks')
      .withIndex('by_assessment', (q) => q.eq('assessmentId', args.assessmentId))
      .order('desc')
      .collect()
  },
})

/**
 * Get tasks by status across all assessments for a user
 */
export const getTasksByUserAndStatus = query({
  args: {
    userId: v.id('users'),
    status: v.optional(assessmentTaskFields.status),
  },
  returns: v.array(assessmentTaskObject),
  handler: async (ctx, args) => {
    // First get all assessments for the user
    const assessments = await ctx.db
      .query('assessments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    const tasks = []
    for (const assessment of assessments) {
      const assessmentTasks = await ctx.db
        .query('assessmentTasks')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', assessment._id))
        .collect()

      tasks.push(...assessmentTasks.filter((task) => (args.status ? task.status === args.status : true)))
    }

    // Sort by creation time (newest first)
    return tasks.sort((a, b) => b._creationTime - a._creationTime)
  },
})

/**
 * Update a task
 */
export const updateTask = mutation({
  args: {
    taskId: v.id('assessmentTasks'),
    name: v.optional(assessmentTaskFields.name),
    status: v.optional(assessmentTaskFields.status),
    priority: v.optional(assessmentTaskFields.priority),
    reminder: v.optional(assessmentTaskFields.reminder),
    description: v.optional(assessmentTaskFields.description),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error('Task not found')
    }

    const validation = validateWithSchema(assessmentTaskSchema.partial(), args)

    // Validate using composite schema (only validate fields that are being updated)
    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    await ctx.db.patch(args.taskId, validation.data)
    return null
  },
})

/**
 * Delete a task
 */
export const deleteTask = mutation({
  args: {
    taskId: v.id('assessmentTasks'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error('Task not found')
    }

    await ctx.db.delete(args.taskId)
    return null
  },
})

/**
 * Get tasks with upcoming reminders
 */
export const getUpcomingTaskReminders = query({
  args: {
    userId: v.id('users'),
    daysAhead: v.optional(v.number()),
  },
  returns: v.array(assessmentTaskObject),
  handler: async (ctx, args) => {
    const daysAhead = args.daysAhead ?? 14 // Default to 14 days
    const now = Date.now()
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000

    // First get all assessments for the user
    const assessments = await ctx.db
      .query('assessments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    const tasks = []
    for (const assessment of assessments) {
      const assessmentTasks = await ctx.db
        .query('assessmentTasks')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', assessment._id))
        .filter((q) =>
          q.and(
            q.neq(q.field('status'), 'done'),
            q.gte(q.field('reminder'), now),
            q.lte(q.field('reminder'), futureDate),
          ),
        )
        .collect()

      tasks.push(...assessmentTasks)
    }

    // Sort by reminder date
    return tasks.sort((a, b) => (a.reminder || 0) - (b.reminder || 0))
  },
})
