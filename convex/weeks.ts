import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth, requireAuthAndOwnership } from './authHelpers'
import { weekFields, weekObject } from './schema'
import { createWeekSchema, validateWithSchema, weekSchema } from './validation'

/**
 * Create a new week or holiday
 */
export const createWeek = mutation({
  args: {
    name: v.string(),
    startDate: v.number(),
    isHoliday: v.boolean(),
    duration: v.optional(v.number()),
  },
  returns: v.id('weeks'),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Validate input using creation schema
    const validation = validateWithSchema(createWeekSchema, args)
    if (!validation.isValid) {
      throw new ConvexError(validation.error!)
    }

    const { name, startDate, isHoliday, duration } = validation.data

    // Calculate end date
    let endDate: number
    if (isHoliday && duration) {
      // For holidays, end date is start date + (duration * 7 days)
      endDate = startDate + duration * 7 * 24 * 60 * 60 * 1000
    } else {
      // For regular weeks, end date is start date + 7 days
      endDate = startDate + 7 * 24 * 60 * 60 * 1000
    }

    // Check for overlapping weeks/holidays
    const existingWeeks = await ctx.db
      .query('weeks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
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
      name,
      startDate,
      endDate,
      isHoliday,
      current: false,
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

    // Find the week marked as current
    const currentWeek = await ctx.db
      .query('weeks')
      .withIndex('by_user_and_current', (q) => q.eq('userId', userId).eq('current', true))
      .first()

    return currentWeek
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

    // Ensure the week to start is not already current
    if (nextWeek.current) {
      throw new ConvexError('This week is already the current week')
    }

    let tasksMovedCount = 0

    // Get ALL weeks that are before the new week (past weeks)
    const pastWeeks = await ctx.db
      .query('weeks')
      .withIndex('by_user_and_start_date', (q) => q.eq('userId', userId))
      .filter((q) => q.lt(q.field('startDate'), nextWeek.startDate))
      .collect()

    // Move ALL tasks from ALL past weeks to the new week
    for (const pastWeek of pastWeeks) {
      const pastWeekTasks = await ctx.db
        .query('tasks')
        .withIndex('by_user_and_week', (q) => q.eq('userId', userId).eq('weekId', pastWeek._id))
        .collect()

      // Move all tasks to the new week
      for (const task of pastWeekTasks) {
        await ctx.db.patch(task._id, { weekId: args.weekId })
        tasksMovedCount++
      }

      // Delete the past week
      await ctx.db.delete(pastWeek._id)
    }

    // Set the new week as current
    await ctx.db.patch(args.weekId, { current: true })

    return { tasksMovedCount }
  },
})
