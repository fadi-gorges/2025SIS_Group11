import { ConvexError, v } from 'convex/values'
import { Doc, Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { requireAuth, requireAuthAndOwnership } from './authHelpers'
import { taskFields, taskObject } from './schema'
import { taskFormSchema, validateWithSchema } from './validation'

/**
 * Create a new task
 */
export const createTask = mutation({
  args: {
    name: taskFields.name,
    description: taskFields.description,
    weekId: v.optional(taskFields.weekId),
    dueDate: taskFields.dueDate,
    status: taskFields.status,
    priority: taskFields.priority,
    reminderTime: taskFields.reminderTime,
    subjectId: taskFields.subjectId,
  },
  returns: v.id('tasks'),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Validate input using composite schema
    const validation = validateWithSchema(taskFormSchema, args)
    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    // Validate optional references exist and belong to user
    if (validation.data.weekId) {
      await requireAuthAndOwnership(ctx, validation.data.weekId as Id<'weeks'>) // weekId validation
    }
    if (validation.data.subjectId) {
      await requireAuthAndOwnership(ctx, validation.data.subjectId as Id<'subjects'>) // subjectId validation
    }

    return await ctx.db.insert('tasks', {
      ...validation.data,
      type: 'task',
      userId,
      subjectId: validation.data.subjectId as Id<'subjects'>,
      assessmentId: undefined,
      weekId: validation.data.weekId as Id<'weeks'>,
    })
  },
})

/**
 * Get all tasks for a user with filtering support
 */
export const getTasksByUser = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(taskFields.status),
    priority: v.optional(taskFields.priority),
    type: v.optional(taskFields.type),
    subjectId: v.optional(v.id('subjects')),
    assessmentId: v.optional(v.id('assessments')),
    weekId: v.optional(v.id('weeks')),
  },
  returns: v.array(taskObject),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const { search, status, priority, type, subjectId, assessmentId, weekId } = args

    const hasSearch = !!search && search.trim().length > 0

    let results
    if (hasSearch) {
      // Use search index for name search
      results = ctx.db
        .query('tasks')
        .withSearchIndex('search_name', (q) => q.search('name', search!.trim()).eq('userId', userId))
    } else {
      results = ctx.db.query('tasks').withIndex('by_user', (q) => q.eq('userId', userId))
    }

    // Apply filters
    if (status !== undefined) {
      results = results.filter((q) => q.eq(q.field('status'), status))
    }
    if (priority !== undefined) {
      results = results.filter((q) => q.eq(q.field('priority'), priority))
    }
    if (type !== undefined) {
      results = results.filter((q) => q.eq(q.field('type'), type))
    }
    if (subjectId !== undefined) {
      results = results.filter((q) => q.eq(q.field('subjectId'), subjectId))
    }
    if (assessmentId !== undefined) {
      results = results.filter((q) => q.eq(q.field('assessmentId'), assessmentId))
    }
    if (weekId !== undefined) {
      results = results.filter((q) => q.eq(q.field('weekId'), weekId))
    }

    const tasks = await results.collect()

    // Sort by due date first (earliest first, nulls last), then by priority, then by name
    return tasks.sort((a, b) => {
      // Due date comparison
      if (a.dueDate && b.dueDate) {
        const dateComparison = a.dueDate - b.dueDate
        if (dateComparison !== 0) return dateComparison
      } else if (a.dueDate && !b.dueDate) {
        return -1 // Tasks with due dates come first
      } else if (!a.dueDate && b.dueDate) {
        return 1 // Tasks without due dates come last
      }

      // Priority comparison (high > medium > low > none)
      const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 }
      const priorityComparison = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityComparison !== 0) return priorityComparison

      // Name comparison
      return a.name.localeCompare(b.name)
    })
  },
})

/**
 * Get tasks by week
 */
export const getTasksByWeek = query({
  args: {
    weekId: v.id('weeks'),
    status: v.optional(taskFields.status),
  },
  returns: v.array(taskObject),
  handler: async (ctx, args) => {
    // Verify week ownership
    await requireAuthAndOwnership(ctx, args.weekId)

    let tasks
    if (args.status !== undefined) {
      tasks = await ctx.db
        .query('tasks')
        .withIndex('by_week', (q) => q.eq('weekId', args.weekId))
        .filter((q) => q.eq(q.field('status'), args.status))
        .collect()
    } else {
      tasks = await ctx.db
        .query('tasks')
        .withIndex('by_week', (q) => q.eq('weekId', args.weekId))
        .collect()
    }

    // Sort by due date (earliest first, nulls last), then by priority, then by name
    return tasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        const dateComparison = a.dueDate - b.dueDate
        if (dateComparison !== 0) return dateComparison
      } else if (a.dueDate && !b.dueDate) {
        return -1
      } else if (!a.dueDate && b.dueDate) {
        return 1
      }

      const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 }
      const priorityComparison = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityComparison !== 0) return priorityComparison

      return a.name.localeCompare(b.name)
    })
  },
})

/**
 * Get tasks for the current active week (for kanban board)
 */
export const getTasksForCurrentWeek = query({
  args: {},
  returns: v.array(taskObject),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)

    // Find the current week
    const now = Date.now()
    const currentWeek = await ctx.db
      .query('weeks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(q.lte(q.field('startDate'), now), q.gt(q.field('endDate'), now), q.eq(q.field('isHoliday'), false)),
      )
      .first()

    if (!currentWeek) {
      return []
    }

    // Get tasks for the current week
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_week', (q) => q.eq('weekId', currentWeek._id))
      .collect()

    return tasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        const dateComparison = a.dueDate - b.dueDate
        if (dateComparison !== 0) return dateComparison
      } else if (a.dueDate && !b.dueDate) {
        return -1
      } else if (!a.dueDate && b.dueDate) {
        return 1
      }

      const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 }
      const priorityComparison = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityComparison !== 0) return priorityComparison

      return a.name.localeCompare(b.name)
    })
  },
})

/**
 * Get a single task by ID
 */
export const getTaskById = query({
  args: {
    taskId: v.id('tasks'),
  },
  returns: v.union(taskObject, v.null()),
  handler: async (ctx, args) => {
    const { data: task } = await requireAuthAndOwnership(ctx, args.taskId, { allowNull: true })
    return task
  },
})

/**
 * Update a task
 */
export const updateTask = mutation({
  args: {
    taskId: v.id('tasks'),
    name: v.optional(taskFields.name),
    description: v.optional(taskFields.description),
    weekId: v.optional(taskFields.weekId),
    dueDate: v.optional(taskFields.dueDate),
    status: v.optional(taskFields.status),
    priority: v.optional(taskFields.priority),
    reminderTime: v.optional(taskFields.reminderTime),
    subjectId: v.optional(taskFields.subjectId),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { data: task } = await requireAuthAndOwnership(ctx, args.taskId)

    // Validate using composite schema (only validate fields that are being updated)
    const validation = validateWithSchema(taskFormSchema.partial(), args)
    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    // Validate optional references if they're being updated
    if (validation.data.weekId !== undefined && validation.data.weekId !== null) {
      await requireAuthAndOwnership(ctx, validation.data.weekId as Id<'weeks'>)
    }
    if (validation.data.subjectId !== undefined && validation.data.subjectId !== null) {
      await requireAuthAndOwnership(ctx, validation.data.subjectId as Id<'subjects'>)
    }

    await ctx.db.patch(args.taskId, {
      ...validation.data,
      weekId: validation.data as Id<'weeks'>,
      subjectId: task.assessmentId ? task.subjectId : (validation.data.subjectId as Id<'subjects'>),
      assessmentId: task.assessmentId,
    })
    return null
  },
})

/**
 * Update task week assignment (for drag and drop)
 */
export const updateTaskWeek = mutation({
  args: {
    taskId: v.id('tasks'),
    weekId: v.union(v.id('weeks'), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthAndOwnership(ctx, args.taskId)

    // Validate week ownership if weekId is provided
    if (args.weekId) {
      await requireAuthAndOwnership(ctx, args.weekId)
    }

    await ctx.db.patch(args.taskId, { weekId: args.weekId as Id<'weeks'> })
    return null
  },
})

/**
 * Delete a task
 */
export const deleteTask = mutation({
  args: {
    taskId: v.id('tasks'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthAndOwnership(ctx, args.taskId)
    await ctx.db.delete(args.taskId)
    return null
  },
})

/**
 * Batch update multiple tasks
 */
export const batchUpdateTasks = mutation({
  args: {
    taskIds: v.array(v.id('tasks')),
    updates: v.object({
      status: v.optional(taskFields.status),
      priority: v.optional(taskFields.priority),
      weekId: v.optional(v.union(v.id('weeks'), v.null())),
    }),
  },
  returns: v.object({
    updatedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    let updatedCount = 0

    // Validate week ownership if weekId is being set
    if (args.updates.weekId !== undefined && args.updates.weekId !== null) {
      await requireAuthAndOwnership(ctx, args.updates.weekId)
    }

    for (const taskId of args.taskIds) {
      try {
        // Verify task ownership
        await requireAuthAndOwnership(ctx, taskId)

        // Apply updates
        const updateData: Partial<Doc<'tasks'>> = {}
        if (args.updates.status !== undefined) updateData.status = args.updates.status
        if (args.updates.priority !== undefined) updateData.priority = args.updates.priority
        if (args.updates.weekId !== undefined) updateData.weekId = args.updates.weekId as Id<'weeks'>

        await ctx.db.patch(taskId, updateData)
        updatedCount++
      } catch (error) {
        // Skip tasks that don't belong to the user
        continue
      }
    }

    return { updatedCount }
  },
})

/**
 * Batch delete multiple tasks
 */
export const batchDeleteTasks = mutation({
  args: {
    taskIds: v.array(v.id('tasks')),
  },
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    let deletedCount = 0

    for (const taskId of args.taskIds) {
      try {
        // Verify task ownership
        await requireAuthAndOwnership(ctx, taskId)
        await ctx.db.delete(taskId)
        deletedCount++
      } catch (error) {
        // Skip tasks that don't belong to the user or don't exist
        continue
      }
    }

    return { deletedCount }
  },
})

/**
 * Clone a task
 */
export const cloneTask = mutation({
  args: {
    taskId: v.id('tasks'),
    name: v.optional(v.string()),
  },
  returns: v.id('tasks'),
  handler: async (ctx, args) => {
    const { data: originalTask, userId } = await requireAuthAndOwnership(ctx, args.taskId)

    const clonedTaskData = {
      name: args.name || `${originalTask.name} (Copy)`,
      type: originalTask.type,
      description: originalTask.description,
      weekId: originalTask.weekId,
      dueDate: originalTask.dueDate,
      status: 'todo' as const, // Reset status for cloned task
      priority: originalTask.priority,
      reminderTime: originalTask.reminderTime,
      userId,
      subjectId: originalTask.subjectId,
      assessmentId: originalTask.assessmentId,
    }

    return await ctx.db.insert('tasks', clonedTaskData)
  },
})

/**
 * Auto-assign task to week based on due date
 */
export const autoAssignTaskToWeek = mutation({
  args: {
    taskId: v.id('tasks'),
  },
  returns: v.union(v.id('weeks'), v.null()),
  handler: async (ctx, args) => {
    const { data: task, userId } = await requireAuthAndOwnership(ctx, args.taskId)

    if (!task.dueDate) {
      return null // No due date, can't auto-assign
    }

    // Find the week that contains the due date
    const targetWeek = await ctx.db
      .query('weeks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.lte(q.field('startDate'), task.dueDate!),
          q.gt(q.field('endDate'), task.dueDate!),
          q.eq(q.field('isHoliday'), false),
        ),
      )
      .first()

    if (targetWeek) {
      await ctx.db.patch(args.taskId, { weekId: targetWeek._id })
      return targetWeek._id
    }

    return null // No appropriate week found
  },
})

/**
 * Get tasks summary for dashboard
 */
export const getTasksSummary = query({
  args: {},
  returns: v.object({
    totalTasks: v.number(),
    todoTasks: v.number(),
    doingTasks: v.number(),
    doneTasks: v.number(),
    overdueTasks: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    const now = Date.now()

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const todoTasks = tasks.filter((task) => task.status === 'todo').length
    const doingTasks = tasks.filter((task) => task.status === 'doing').length
    const doneTasks = tasks.filter((task) => task.status === 'done').length
    const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < now && task.status !== 'done').length

    return {
      totalTasks: tasks.length,
      todoTasks,
      doingTasks,
      doneTasks,
      overdueTasks,
    }
  },
})
