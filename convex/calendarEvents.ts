import { v } from 'convex/values'
import { mutation, query, action } from './_generated/server'
import { api } from './_generated/api'
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

/**
 * Import events from iCal URL (Action)
 */
export const importEventsFromICal = action({
  args: {
    icalUrl: v.string(),
    calendarName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean
    importedCount: number
    events: string[]
  }> => {
    // Get user ID from the action context
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Not authenticated')
    }
    
    // Get user from database
    const user = await ctx.runQuery(api.users.getCurrentUser)
    if (!user) {
      throw new Error('User not found')
    }

    try {
      // Fetch iCal data
      const normalizedUrl = args.icalUrl.replace(/^webcal:\/\//, 'https://')
      const response = await fetch(normalizedUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch iCal data: ${response.status} ${response.statusText}`)
      }
      
      const icalData = await response.text()
      
      // Parse iCal data (simplified parser)
      const events = parseICalData(icalData, args.calendarName || 'Imported Calendar')
      
      // Create events in database using mutation
      const createdEvents: string[] = []
      for (const event of events) {
        const eventId: string = await ctx.runMutation(api.calendarEvents.createEvent, {
          name: event.name,
          description: event.description,
          date: event.date,
          time: event.time,
        })
        createdEvents.push(eventId)
      }
      
      return {
        success: true,
        importedCount: createdEvents.length,
        events: createdEvents,
      }
    } catch (error) {
      console.error('Error importing iCal events:', error)
      throw new Error(`Failed to import events: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})

/**
 * Enhanced iCal parser for server-side use
 */
function parseICalData(content: string, calendarName: string) {
  const events: Array<{
    name: string
    description?: string
    date: number
    time?: string
  }> = []
  
  const lines = content.split('\n').map(line => line.trim())
  let currentEvent: any = {}
  let inEvent = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Handle line folding
    let fullLine = line
    while (i + 1 < lines.length && lines[i + 1].startsWith(' ')) {
      i++
      fullLine += lines[i].substring(1)
    }
    
    if (fullLine === 'BEGIN:VEVENT') {
      inEvent = true
      currentEvent = {}
      continue
    }
    
    if (fullLine === 'END:VEVENT') {
      if (inEvent && currentEvent.name && currentEvent.date) {
        events.push(currentEvent)
      }
      inEvent = false
      currentEvent = {}
      continue
    }
    
    if (!inEvent) continue
    
    // Parse event properties
    if (fullLine.startsWith('SUMMARY:')) {
      currentEvent.name = fullLine.substring('SUMMARY:'.length).replace(/\\,/g, ',')
    } else if (fullLine.startsWith('DESCRIPTION:')) {
      currentEvent.description = fullLine.substring('DESCRIPTION:'.length).replace(/\\,/g, ',').replace(/\\n/g, '\n')
    } else if (fullLine.startsWith('LOCATION:')) {
      currentEvent.location = fullLine.substring('LOCATION:'.length)
    } else if (fullLine.startsWith('DTSTART')) {
      const dateStr = extractDateFromProperty(fullLine)
      if (dateStr) {
        const date = parseICalDate(dateStr)
        if (date) {
          currentEvent.date = date.getTime()
          if (dateStr.includes('T')) {
            currentEvent.time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        }
      }
    }
  }
  
  return events
}

function extractDateFromProperty(line: string): string | null {
  const match = line.match(/DTSTART[^:]*:(.+)/)
  return match ? match[1] : null
}

function parseICalDate(dateStr: string): Date | null {
  try {
    // Handle timezone-aware dates like "20250221T180000" with TZID
    if (dateStr.length === 15 && dateStr.includes('T')) {
      // YYYYMMDDTHHMMSS format (local time)
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1
      const day = parseInt(dateStr.substring(6, 8))
      const hour = parseInt(dateStr.substring(9, 11))
      const minute = parseInt(dateStr.substring(11, 13))
      const second = parseInt(dateStr.substring(13, 15))
      
      return new Date(year, month, day, hour, minute, second)
    } else if (dateStr.length === 8) {
      // YYYYMMDD format
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1
      const day = parseInt(dateStr.substring(6, 8))
      return new Date(year, month, day)
    } else if (dateStr.length === 15 && dateStr.includes('T') && dateStr.endsWith('Z')) {
      // YYYYMMDDTHHMMSSZ format (UTC)
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1
      const day = parseInt(dateStr.substring(6, 8))
      const hour = parseInt(dateStr.substring(9, 11))
      const minute = parseInt(dateStr.substring(11, 13))
      const second = parseInt(dateStr.substring(13, 15))
      
      const date = new Date(year, month, day, hour, minute, second)
      
      // Handle UTC timezone (Z suffix)
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    } else if (dateStr.length === 16 && dateStr.includes('T')) {
      // YYYYMMDDTHHMMSS format (local time)
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1
      const day = parseInt(dateStr.substring(6, 8))
      const hour = parseInt(dateStr.substring(9, 11))
      const minute = parseInt(dateStr.substring(11, 13))
      const second = parseInt(dateStr.substring(13, 15))
      
      return new Date(year, month, day, hour, minute, second)
    }
    
    return null
  } catch (error) {
    console.error('Error parsing iCal date:', dateStr, error)
    return null
  }
}