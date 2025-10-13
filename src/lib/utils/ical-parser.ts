/**
 * iCal parsing utilities for importing calendar events
 */

export interface ParsedEvent {
  name: string
  description?: string
  date: number // timestamp
  time?: string
  location?: string
  url?: string
  uid?: string
  source?: string // URL of the iCal feed
}

export interface ICalParseResult {
  events: ParsedEvent[]
  calendarName?: string
  errors: string[]
}

/**
 * Parse iCal data from a URL or string content
 */
export async function parseICalFromUrl(url: string): Promise<ICalParseResult> {
  try {
    // Convert webcal:// to https://
    const normalizedUrl = url.replace(/^webcal:\/\//, 'https://')
    
    const response = await fetch(normalizedUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal data: ${response.status} ${response.statusText}`)
    }
    
    const icalData = await response.text()
    return parseICalContent(icalData, url)
  } catch (error) {
    return {
      events: [],
      errors: [`Failed to fetch iCal data: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Parse iCal content from a string
 */
export function parseICalContent(content: string, sourceUrl?: string): ICalParseResult {
  const events: ParsedEvent[] = []
  const errors: string[] = []
  let calendarName: string | undefined

  try {
    // Simple iCal parser - this is a basic implementation
    // For production use, consider using a more robust library like 'ical.js' or 'node-ical'
    const lines = content.split('\n').map(line => line.trim())
    
    let currentEvent: Partial<ParsedEvent> = {}
    let inEvent = false
    let inCalendar = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Handle line folding (lines that continue on the next line)
      let fullLine = line
      while (i + 1 < lines.length && lines[i + 1].startsWith(' ')) {
        i++
        fullLine += lines[i].substring(1)
      }
      
      if (fullLine === 'BEGIN:VCALENDAR') {
        inCalendar = true
        continue
      }
      
      if (fullLine === 'END:VCALENDAR') {
        inCalendar = false
        continue
      }
      
      if (fullLine === 'BEGIN:VEVENT') {
        inEvent = true
        currentEvent = { source: sourceUrl }
        continue
      }
      
      if (fullLine === 'END:VEVENT') {
        if (inEvent && currentEvent.name && currentEvent.date) {
          events.push(currentEvent as ParsedEvent)
        }
        inEvent = false
        currentEvent = {}
        continue
      }
      
      if (!inCalendar) continue
      
      // Parse calendar properties
      if (fullLine.startsWith('X-WR-CALNAME:')) {
        calendarName = fullLine.substring('X-WR-CALNAME:'.length)
        continue
      }
      
      if (!inEvent) continue
      
      // Parse event properties
      if (fullLine.startsWith('SUMMARY:')) {
        currentEvent.name = fullLine.substring('SUMMARY:'.length)
      } else if (fullLine.startsWith('DESCRIPTION:')) {
        currentEvent.description = fullLine.substring('DESCRIPTION:'.length)
      } else if (fullLine.startsWith('LOCATION:')) {
        currentEvent.location = fullLine.substring('LOCATION:'.length)
      } else if (fullLine.startsWith('URL:')) {
        currentEvent.url = fullLine.substring('URL:'.length)
      } else if (fullLine.startsWith('UID:')) {
        currentEvent.uid = fullLine.substring('UID:'.length)
      } else if (fullLine.startsWith('DTSTART')) {
        const dateStr = extractDateFromProperty(fullLine)
        if (dateStr) {
          const date = parseICalDate(dateStr)
          if (date) {
            currentEvent.date = date.getTime()
            // Extract time if it's a datetime
            if (dateStr.includes('T')) {
              currentEvent.time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          }
        }
      }
    }
    
  } catch (error) {
    errors.push(`Failed to parse iCal content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return {
    events,
    calendarName,
    errors
  }
}

/**
 * Extract date string from iCal property line
 */
function extractDateFromProperty(line: string): string | null {
  // Handle different date formats: DTSTART:20231201T090000Z, DTSTART;VALUE=DATE:20231201, etc.
  const match = line.match(/DTSTART[^:]*:(.+)/)
  return match ? match[1] : null
}

/**
 * Parse iCal date string to JavaScript Date
 */
function parseICalDate(dateStr: string): Date | null {
  try {
    // Handle different iCal date formats
    if (dateStr.length === 8) {
      // YYYYMMDD format
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1 // JavaScript months are 0-based
      const day = parseInt(dateStr.substring(6, 8))
      return new Date(year, month, day)
    } else if (dateStr.length === 15 && dateStr.includes('T')) {
      // YYYYMMDDTHHMMSSZ format
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1
      const day = parseInt(dateStr.substring(6, 8))
      const hour = parseInt(dateStr.substring(9, 11))
      const minute = parseInt(dateStr.substring(11, 13))
      const second = parseInt(dateStr.substring(13, 15))
      
      const date = new Date(year, month, day, hour, minute, second)
      
      // Handle UTC timezone (Z suffix)
      if (dateStr.endsWith('Z')) {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      }
      
      return date
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

/**
 * Validate iCal URL format
 */
export function validateICalUrl(url: string): { isValid: boolean; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: 'URL is required' }
  }
  
  // Check for valid URL formats
  const urlPattern = /^(https?|webcal):\/\/.+/i
  if (!urlPattern.test(url)) {
    return { isValid: false, error: 'Please enter a valid URL (http://, https://, or webcal://)' }
  }
  
  return { isValid: true }
}
