import type { Doc } from '../../../convex/_generated/dataModel'

/**
 * Generate automatic week name based on existing weeks
 */
export function generateWeekName(weeks: Doc<'weeks'>[], isHoliday: boolean): string {
  if (isHoliday) {
    return 'Holiday'
  }

  // Find existing weeks to determine next number
  const regularWeeks = weeks.filter((week) => !week.isHoliday)

  // Extract week numbers from names like "Week 1", "Week 2", etc.
  const weekNumbers = regularWeeks
    .map((week) => {
      const match = week.name.match(/^Week\s+(\d+)$/i)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((num) => num > 0)

  // Find the next available number
  const maxNumber = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 0
  return `Week ${maxNumber + 1}`
}

/**
 * Get the suggested start date for a new week
 */
export function getSuggestedStartDate(weeks: Doc<'weeks'>[]): number {
  if (weeks.length === 0) {
    // No existing weeks, start from next Monday
    const now = new Date()
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7
    const nextMonday = new Date(now)
    nextMonday.setDate(now.getDate() + daysUntilMonday)
    nextMonday.setHours(0, 0, 0, 0)
    return nextMonday.getTime()
  }

  // Find the latest week (sorted by start date)
  const sortedWeeks = [...weeks].sort((a, b) => b.startDate - a.startDate)
  const latestWeek = sortedWeeks[0]

  // Start the new week when the latest week ends
  return latestWeek.endDate
}
