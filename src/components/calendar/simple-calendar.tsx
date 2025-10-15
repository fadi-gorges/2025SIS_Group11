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

type CalendarItem = {
  id: string
  type: 'event' | 'task' | 'assessment'
  name: string
  description?: string
  date: number
  time?: string
  source: 'calendar' | 'tasks' | 'assessments'
  priority: 'high' | 'medium' | 'low' | 'none'
  status: string
}

interface SimpleCalendarProps {
  className?: string
  onDateSelect?: (date: Date, items: CalendarItem[]) => void
}

export function SimpleCalendar({ className, onDateSelect }: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  // Get all calendar items (events + tasks + assessments) for the current month
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarItems = useQuery(api.calendarEvents.getCalendarItemsInRange, {
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

  // Helper function to get calendar items for a specific date
  const getItemsForDate = (date: Date): CalendarItem[] => {
    if (!calendarItems) return []
    
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    return calendarItems.filter(item => {
      const itemDate = new Date(item.date)
      itemDate.setHours(0, 0, 0, 0)
      return itemDate.getTime() === targetDate.getTime()
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
          const dayItems = getItemsForDate(day)
          const itemCount = dayItems.length

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[120px] p-1 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors',
                !isCurrentMonth && 'text-muted-foreground bg-muted/20',
                isToday && 'bg-primary/10 border-primary',
                isSelected && 'bg-primary/20 border-primary',
                // Add darker styling for free days (days with no events)
                dayItems.length >>> 0 && isCurrentMonth && 'bg-gray-950 text-gray-300'
              )}
              onClick={() => {
                setSelectedDate(day)
                onDateSelect?.(day, dayItems)
              }}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              {/* Show events with titles */}
              {dayItems.length > 0 && (
                <div className="mt-1 space-y-1">
                  {dayItems.slice(0, 3).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1"
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          item.type === 'assessment' && 'bg-red-500',
                          item.type === 'task' && item.priority === 'high' && 'bg-orange-500',
                          item.type === 'task' && item.priority === 'medium' && 'bg-yellow-500',
                          item.type === 'task' && item.priority === 'low' && 'bg-green-500',
                          item.type === 'event' && 'bg-blue-500'
                        )}
                        title={`${item.name} (${item.type})`}
                      />
                      <span className="text-xs text-foreground truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                  {dayItems.length > 3 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        +{dayItems.length - 3} more
                      </span>
                    </div>
                  )}
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
        
        {/* Legend integrated into calendar header */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Assessments</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>High Priority Tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>Medium Priority Tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Low Priority Tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Events</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderCalendar()}
        
      </CardContent>
    </Card>
  )
}
