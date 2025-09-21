'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Doc } from '../../../convex/_generated/dataModel'

type CalendarEvent = Doc<'calendarEvents'>

interface SimpleCalendarProps {
  className?: string
  onDateSelect?: (date: Date, events: CalendarEvent[]) => void
}

export function SimpleCalendar({ className, onDateSelect }: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  // Get all events for the current month
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const events = useQuery(api.calendarEvents.getEventsInRange, {
    startDate: monthStart.getTime(),
    endDate: monthEnd.getTime(),
  })

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  // Helper function to get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!events) return []
    
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    return events.filter(event => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === targetDate.getTime()
    })
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const dayEvents = getEventsForDate(day)
          const eventCount = dayEvents.length

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[80px] p-1 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors',
                !isCurrentMonth && 'text-muted-foreground bg-muted/20',
                isToday && 'bg-primary/10 border-primary',
                isSelected && 'bg-primary/20 border-primary'
              )}
              onClick={() => {
                setSelectedDate(day)
                onDateSelect?.(day, dayEvents)
              }}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              {/* Event count indicator */}
              {eventCount > 0 && (
                <div className="text-xs text-primary font-medium">
                  {eventCount} event{eventCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderCalendar()}
        
        {/* Selected date info */}
        {selectedDate && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">
              Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
            {(() => {
              const dayEvents = getEventsForDate(selectedDate)
              return dayEvents.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {dayEvents.map(event => (
                    <div key={event._id} className="text-xs bg-background p-2 rounded border">
                      <div className="font-medium">{event.name}</div>
                      {event.time && (
                        <div className="text-muted-foreground">{event.time}</div>
                      )}
                      {event.description && (
                        <div className="text-muted-foreground mt-1">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-1">
                  No events scheduled for this day
                </div>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
