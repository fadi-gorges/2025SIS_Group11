import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth, requireAuthAndOwnership } from './authHelpers'
import { weekFields, weekObject } from './schema'
import { validateWithSchema, weekSchema } from './validation'

/**
 * Create a new week or holiday
 */
export const createWeek = mutation({
  args: {
    name: weekFields.name,
    startDate: weekFields.startDate,
    endDate: weekFields.endDate,
    isHoliday: weekFields.isHoliday,
    duration: weekFields.duration,
  },
  returns: v.id('weeks'),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Validate input using composite schema
    const validation = validateWithSchema(weekSchema, args)
    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    // Check for overlapping weeks/holidays
    const existingWeeks = await ctx.db
      .query('weeks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const { startDate, endDate } = validation.data
    const hasOverlap = existingWeeks.some((week) => {
      return (
        (startDate >= week.startDate && startDate < week.endDate) ||
        (endDate > week.startDate && endDate <= week.endDate) ||
        (startDate <= week.startDate && endDate >= week.endDate)
      )
    })

    if (hasOverlap) {
      throw new ConvexError('This week overlaps with an existing week or holiday')
    }

    return await ctx.db.insert('weeks', {
      ...validation.data,
      userId,
    })
  },
})

/**
 * Get all weeks for a user, sorted by start date
 */
export const getWeeksByUser = query({
  args: {
    includeHolidays: v.optional(v.boolean()),
  },
  returns: v.array(weekObject),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const { includeHolidays = true } = args

    let weeks = await ctx.db
      .query('weeks')
      .withIndex('by_user_and_start_date', (q) => q.eq('userId', userId))
      .order('asc')
      .collect()

    if (!includeHolidays) {
      weeks = weeks.filter((week) => !week.isHoliday)
    }

    return weeks
  },
})

/**
 * Get the current active week
 */
export const getCurrentWeek = query({
  args: {},
  returns: v.union(weekObject, v.null()),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    const now = Date.now()

    // Find the week that contains the current date
    const currentWeek = await ctx.db
      .query('weeks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.lte(q.field('startDate'), now),
          q.gt(q.field('endDate'), now),
          q.eq(q.field('isHoliday'), false), // Only regular weeks, not holidays
        ),
      )
      .first()

    return currentWeek
  },
})

/**
 * Get the next week in sequence for the "Start Week" functionality
 */
export const getNextWeek = query({
  args: {},
  returns: v.union(weekObject, v.null()),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    const currentWeek = await ctx.db
      .query('weeks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.lte(q.field('startDate'), Date.now()),
          q.gt(q.field('endDate'), Date.now()),
          q.eq(q.field('isHoliday'), false),
        ),
      )
      .first()

    if (!currentWeek) {
      // No current week, find the earliest week
      return await ctx.db
        .query('weeks')
        .withIndex('by_user_and_start_date', (q) => q.eq('userId', userId))
        .filter((q) => q.eq(q.field('isHoliday'), false))
        .order('asc')
        .first()
    }

    // Find the next week after current
    return await ctx.db
      .query('weeks')
      .withIndex('by_user_and_start_date', (q) => q.eq('userId', userId))
      .filter((q) => q.and(q.gt(q.field('startDate'), currentWeek.endDate), q.eq(q.field('isHoliday'), false)))
      .order('asc')
      .first()
  },
})

/**
 * Get a single week by ID
 */
export const getWeekById = query({
  args: {
    weekId: v.id('weeks'),
  },
  returns: v.union(weekObject, v.null()),
  handler: async (ctx, args) => {
    const { data: week } = await requireAuthAndOwnership(ctx, args.weekId, { allowNull: true })
    return week
  },
})

/**
 * Update a week
 */
export const updateWeek = mutation({
  args: {
    weekId: v.id('weeks'),
    name: v.optional(weekFields.name),
    startDate: v.optional(weekFields.startDate),
    endDate: v.optional(weekFields.endDate),
    duration: v.optional(weekFields.duration),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { data: week } = await requireAuthAndOwnership(ctx, args.weekId)

    // Validate using composite schema (only validate fields that are being updated)
    const validation = validateWithSchema(weekSchema.partial(), args)
    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    // If updating dates, check for overlaps
    if (validation.data.startDate !== undefined || validation.data.endDate !== undefined) {
      const startDate = validation.data.startDate ?? week.startDate
      const endDate = validation.data.endDate ?? week.endDate

      const existingWeeks = await ctx.db
        .query('weeks')
        .withIndex('by_user', (q) => q.eq('userId', week.userId))
        .filter((q) => q.neq(q.field('_id'), args.weekId))
        .collect()

      const hasOverlap = existingWeeks.some((otherWeek) => {
        return (
          (startDate >= otherWeek.startDate && startDate < otherWeek.endDate) ||
          (endDate > otherWeek.startDate && endDate <= otherWeek.endDate) ||
          (startDate <= otherWeek.startDate && endDate >= otherWeek.endDate)
        )
      })

      if (hasOverlap) {
        throw new ConvexError('This week would overlap with an existing week or holiday')
      }
    }

    await ctx.db.patch(args.weekId, validation.data)
    return null
  },
})

/**
 * Delete a week and handle task reassignment
 */
export const deleteWeek = mutation({
  args: {
    weekId: v.id('weeks'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthAndOwnership(ctx, args.weekId)

    // Get all tasks assigned to this week
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_week', (q) => q.eq('weekId', args.weekId))
      .collect()

    // Remove week assignment from all tasks
    for (const task of tasks) {
      await ctx.db.patch(task._id, { weekId: undefined })
    }

    // Delete the week
    await ctx.db.delete(args.weekId)
    return null
  },
})

/**
 * Generate automatic week name based on existing weeks
 */
export const generateWeekName = query({
  args: {
    isHoliday: v.boolean(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const { isHoliday } = args

    if (isHoliday) {
      return 'Holiday'
    }

    // Find existing weeks to determine next number
    const existingWeeks = await ctx.db
      .query('weeks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isHoliday'), false))
      .collect()

    // Extract week numbers from names like "Week 1", "Week 2", etc.
    const weekNumbers = existingWeeks
      .map((week) => {
        const match = week.name.match(/^Week\s+(\d+)$/i)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((num) => num > 0)

    // Find the next available number
    const maxNumber = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 0
    return `Week ${maxNumber + 1}`
  },
})

/**
 * Get the suggested start date for a new week
 */
export const getSuggestedStartDate = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)

    // Find the latest week
    const latestWeek = await ctx.db
      .query('weeks')
      .withIndex('by_user_and_start_date', (q) => q.eq('userId', userId))
      .order('desc')
      .first()

    if (!latestWeek) {
      // No existing weeks, start from next Monday
      const now = new Date()
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7
      const nextMonday = new Date(now)
      nextMonday.setDate(now.getDate() + daysUntilMonday)
      nextMonday.setHours(0, 0, 0, 0)
      return nextMonday.getTime()
    }

    // Start the new week when the latest week ends
    return latestWeek.endDate
  },
})

/**
 * Start a new week (transition from current to next week)
 */
export const startWeek = mutation({
  args: {
    weekId: v.id('weeks'),
  },
  returns: v.object({
    tasksMovedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const { data: nextWeek, userId } = await requireAuthAndOwnership(ctx, args.weekId)

    // Get the current week
    const currentWeek = await ctx.db
      .query('weeks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.lte(q.field('startDate'), Date.now()),
          q.gt(q.field('endDate'), Date.now()),
          q.eq(q.field('isHoliday'), false),
        ),
      )
      .first()

    if (!currentWeek) {
      throw new ConvexError('No current week found')
    }

    if (nextWeek.startDate <= currentWeek.startDate) {
      throw new ConvexError('Cannot start a week that is not in the future')
    }

    // Get all incomplete tasks from the current week
    const incompleteTasks = await ctx.db
      .query('tasks')
      .withIndex('by_user_and_week', (q) => q.eq('userId', userId).eq('weekId', currentWeek._id))
      .filter((q) => q.neq(q.field('status'), 'done'))
      .collect()

    // Move incomplete tasks to the new week
    let tasksMovedCount = 0
    for (const task of incompleteTasks) {
      await ctx.db.patch(task._id, { weekId: args.weekId })
      tasksMovedCount++
    }

    return { tasksMovedCount }
  },
})

/**
 * Get week statistics (task counts, etc.)
 */
export const getWeekStats = query({
  args: {
    weekId: v.id('weeks'),
  },
  returns: v.object({
    totalTasks: v.number(),
    todoTasks: v.number(),
    doingTasks: v.number(),
    doneTasks: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAuthAndOwnership(ctx, args.weekId)

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_week', (q) => q.eq('weekId', args.weekId))
      .collect()

    const todoTasks = tasks.filter((task) => task.status === 'todo').length
    const doingTasks = tasks.filter((task) => task.status === 'doing').length
    const doneTasks = tasks.filter((task) => task.status === 'done').length

    return {
      totalTasks: tasks.length,
      todoTasks,
      doingTasks,
      doneTasks,
    }
  },
})
