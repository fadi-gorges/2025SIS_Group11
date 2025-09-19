'use client'

import WeekColumn from '@/app/(authenticated)/timeline/_components/week-column'
import WeekFormSheet from '@/app/(authenticated)/timeline/_components/week-form-sheet'
import SearchInput from '@/components/extensions/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePreloadedQuery, type Preloaded } from 'convex/react'
import { CalendarPlusIcon, CalendarRangeIcon } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../../../../convex/_generated/api'

type TimelineBoardProps = {
  preloadedWeeks: Preloaded<typeof api.weeks.getWeeksByUser>
  preloadedTasks: Preloaded<typeof api.tasks.getTasksByUser>
}

const TimelineBoard = ({ preloadedWeeks, preloadedTasks }: TimelineBoardProps) => {
  const weeks = usePreloadedQuery(preloadedWeeks)
  const tasks = usePreloadedQuery(preloadedTasks)
  const [openWeekForm, setOpenWeekForm] = useState<{
    mode: 'create'
    isHoliday: boolean
  } | null>(null)

  return (
    <div className="flex h-full flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <SearchInput searchName="tasks" />
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpenWeekForm({ mode: 'create', isHoliday: true })}>
            <CalendarRangeIcon className="size-4" /> Add holiday
          </Button>
          <Button size="sm" onClick={() => setOpenWeekForm({ mode: 'create', isHoliday: false })}>
            <CalendarPlusIcon className="size-4" /> Add week
          </Button>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-3 pb-2">
        {weeks.length === 0 ? (
          <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-3 text-center">
            <Badge variant="secondary">No weeks yet</Badge>
            <p className="text-muted-foreground text-sm">Create your first week to start planning.</p>
            <Button size="sm" onClick={() => setOpenWeekForm({ mode: 'create', isHoliday: false })}>
              <CalendarPlusIcon className="size-4" /> Create Week 1
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            {weeks.map((week) => (
              <WeekColumn key={week._id} week={week} tasks={tasks.filter((task) => task.weekId === week._id)} />
            ))}
          </div>
        )}
      </div>

      {openWeekForm && (
        <WeekFormSheet
          open={!!openWeekForm}
          onOpenChange={() => setOpenWeekForm(null)}
          isHoliday={openWeekForm.isHoliday}
          weeks={weeks}
        />
      )}
    </div>
  )
}

export default TimelineBoard
