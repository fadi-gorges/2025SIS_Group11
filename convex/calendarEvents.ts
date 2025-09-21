import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth } from './authHelpers'

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all calendar events for a user
 */
export const getAllEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)

    return await ctx.db
      .query('calendarEvents')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
  },
})

/**
 * Get calendar events for a specific date
 */
export const getEventsForDate = query({
  args: {
    date: v.number(), // timestamp
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Get start and end of the day
    const targetDate = new Date(args.date)
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime()
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1

    return await ctx.db
      .query('calendarEvents')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId).gte('date', startOfDay))
      .filter((q) => q.lte(q.field('date'), endOfDay))
      .collect()
  },
})

/**
 * Get calendar events for a date range
 */
export const getEventsInRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    return await ctx.db
      .query('calendarEvents')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId).gte('date', args.startDate))
      .filter((q) => q.lte(q.field('date'), args.endDate))
      .collect()
  },
})

/**
 * Get calendar events for a specific month
 */
export const getEventsForMonth = query({
  args: {
    year: v.number(),
    month: v.number(), // 0-11
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const startOfMonth = new Date(args.year, args.month, 1).getTime()
    const endOfMonth = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime()

    return await ctx.db
      .query('calendarEvents')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId).gte('date', startOfMonth))
      .filter((q) => q.lte(q.field('date'), endOfMonth))
      .collect()
  },
})

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new calendar event
 */
export const createEvent = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    return await ctx.db.insert('calendarEvents', {
      ...args,
      userId,
    })
  },
})

/**
 * Update a calendar event
 */
export const updateEvent = mutation({
  args: {
    id: v.id('calendarEvents'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const { id, ...updates } = args

    // Verify the event belongs to the user
    const event = await ctx.db.get(id)
    if (!event || event.userId !== userId) {
      throw new Error('Event not found or access denied')
    }

    return await ctx.db.patch(id, updates)
  },
})

/**
 * Delete a calendar event
 */
export const deleteEvent = mutation({
  args: {
    id: v.id('calendarEvents'),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Verify the event belongs to the user
    const event = await ctx.db.get(args.id)
    if (!event || event.userId !== userId) {
      throw new Error('Event not found or access denied')
    }

    return await ctx.db.delete(args.id)
  },
})
