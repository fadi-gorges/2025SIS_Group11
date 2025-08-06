import { v } from 'convex/values'
import { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'

// Task validation constants
const TASK_NAME_MAX_LENGTH = 100
const TASK_DESCRIPTION_MAX_LENGTH = 2000

/**
 * Add a task to an assessment
 */
export const addTask = mutation({
  args: {
    assessmentId: v.id('assessments'),
    name: v.string(),
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
    priority: v.optional(v.union(v.literal('none'), v.literal('low'), v.literal('medium'), v.literal('high'))),
    reminder: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  returns: v.id('assessmentTasks'),
  handler: async (ctx, args) => {
    // Validate input
    if (args.name.length === 0 || args.name.length > TASK_NAME_MAX_LENGTH) {
      throw new Error(`Task name must be between 1 and ${TASK_NAME_MAX_LENGTH} characters`)
    }

    if (args.description && args.description.length > TASK_DESCRIPTION_MAX_LENGTH) {
      throw new Error(`Task description must be no more than ${TASK_DESCRIPTION_MAX_LENGTH} characters`)
    }

    // Check if assessment exists
    const assessment = await ctx.db.get(args.assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found')
    }

    return await ctx.db.insert('assessmentTasks', {
      assessmentId: args.assessmentId,
      name: args.name.trim(),
      status: args.status ?? 'todo',
      priority: args.priority ?? 'none',
      reminder: args.reminder,
      description: args.description?.trim(),
    })
  },
})

/**
 * Get all tasks for an assessment
 */
export const getTasksByAssessment = query({
  args: {
    assessmentId: v.id('assessments'),
  },
  returns: v.array(
    v.object({
      _id: v.id('assessmentTasks'),
      _creationTime: v.number(),
      assessmentId: v.id('assessments'),
      name: v.string(),
      status: v.union(v.literal('todo'), v.literal('doing'), v.literal('done')),
      priority: v.union(v.literal('none'), v.literal('low'), v.literal('medium'), v.literal('high')),
      reminder: v.optional(v.number()),
      description: v.optional(v.string()),
    }),
  ),
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
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
  },
  returns: v.array(
    v.object({
      _id: v.id('assessmentTasks'),
      _creationTime: v.number(),
      assessmentId: v.id('assessments'),
      name: v.string(),
      status: v.union(v.literal('todo'), v.literal('doing'), v.literal('done')),
      priority: v.union(v.literal('none'), v.literal('low'), v.literal('medium'), v.literal('high')),
      reminder: v.optional(v.number()),
      description: v.optional(v.string()),
    }),
  ),
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

      if (args.status) {
        tasks.push(...assessmentTasks.filter((task) => task.status === args.status))
      } else {
        tasks.push(...assessmentTasks)
      }
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
    name: v.optional(v.string()),
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
    priority: v.optional(v.union(v.literal('none'), v.literal('low'), v.literal('medium'), v.literal('high'))),
    reminder: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error('Task not found')
    }

    const updateData: Partial<Doc<'assessmentTasks'>> = {}

    if (args.name !== undefined) {
      if (args.name.length === 0 || args.name.length > TASK_NAME_MAX_LENGTH) {
        throw new Error(`Task name must be between 1 and ${TASK_NAME_MAX_LENGTH} characters`)
      }
      updateData.name = args.name.trim()
    }

    if (args.status !== undefined) {
      updateData.status = args.status
    }

    if (args.priority !== undefined) {
      updateData.priority = args.priority
    }

    if (args.reminder !== undefined) {
      updateData.reminder = args.reminder
    }

    if (args.description !== undefined) {
      if (args.description.length > TASK_DESCRIPTION_MAX_LENGTH) {
        throw new Error(`Task description must be no more than ${TASK_DESCRIPTION_MAX_LENGTH} characters`)
      }
      updateData.description = args.description.trim() || undefined
    }

    await ctx.db.patch(args.taskId, updateData)
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
 * Update task status
 */
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id('assessmentTasks'),
    status: v.union(v.literal('todo'), v.literal('doing'), v.literal('done')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error('Task not found')
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
    })
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
  returns: v.array(
    v.object({
      _id: v.id('assessmentTasks'),
      _creationTime: v.number(),
      assessmentId: v.id('assessments'),
      name: v.string(),
      status: v.union(v.literal('todo'), v.literal('doing'), v.literal('done')),
      priority: v.union(v.literal('none'), v.literal('low'), v.literal('medium'), v.literal('high')),
      reminder: v.optional(v.number()),
      description: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const daysAhead = args.daysAhead ?? 7 // Default to 7 days
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
