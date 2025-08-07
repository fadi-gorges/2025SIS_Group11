import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth, requireAuthAndOwnership } from './authHelpers'
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

    // Check if assessment exists and belongs to user
    const { userId } = await requireAuthAndOwnership(ctx, args.assessmentId)

    return await ctx.db.insert('assessmentTasks', {
      ...validation.data,
      userId,
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
    // Check if assessment belongs to user
    await requireAuthAndOwnership(ctx, args.assessmentId)

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
    status: v.optional(assessmentTaskFields.status),
  },
  returns: v.array(assessmentTaskObject),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    let query = ctx.db.query('assessmentTasks').withIndex('by_user', (q) => q.eq('userId', userId))

    // Filter by status if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status))
    }

    return await query.order('desc').collect()
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
    await requireAuthAndOwnership(ctx, args.taskId)

    const validation = validateWithSchema(assessmentTaskSchema.partial(), args)

    // Validate using composite schema (only validate fields that are being updated)
    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    await ctx.db.patch(args.taskId, validation.data)
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
    await requireAuthAndOwnership(ctx, args.taskId)
    await ctx.db.delete(args.taskId)
  },
})

/**
 * Get tasks with upcoming reminders
 */
export const getUpcomingTaskReminders = query({
  args: {
    daysAhead: v.optional(v.number()),
  },
  returns: v.array(assessmentTaskObject),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const daysAhead = args.daysAhead ?? 14 // Default to 14 days
    const now = Date.now()
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000

    return await ctx.db
      .query('assessmentTasks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.neq(q.field('status'), 'done'),
          q.gte(q.field('reminder'), now),
          q.lte(q.field('reminder'), futureDate),
        ),
      )
      .order('asc') // Order by creation time ascending, then sort by reminder date
      .collect()
      .then((tasks) =>
        // Sort by reminder date (earliest first)
        tasks.sort((a, b) => (a.reminder || 0) - (b.reminder || 0)),
      )
  },
})
