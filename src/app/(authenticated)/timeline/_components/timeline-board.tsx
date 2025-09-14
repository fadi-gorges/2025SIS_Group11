'use client'

import WeekColumn from '@/app/(authenticated)/timeline/_components/week-column'
import WeekFormSheet from '@/app/(authenticated)/timeline/_components/week-form-sheet'
import SearchInput from '@/components/extensions/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMutation, usePreloadedQuery, useQuery, type Preloaded } from 'convex/react'
import { CalendarPlusIcon, CalendarRangeIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

type TimelineBoardProps = {
  params: { [key: string]: string | string[] | undefined }
  preloadedWeeks: Preloaded<typeof api.weeks.getWeeksByUser>
  preloadedSubjects: Preloaded<typeof api.subjects.getSubjectsByUser>
  preloadedAssessments: Preloaded<typeof api.assessments.getAssessmentsByUser>
}

const TimelineBoard = ({ params, preloadedWeeks }: TimelineBoardProps) => {
  const weeks = usePreloadedQuery(preloadedWeeks)
  const [openWeekForm, setOpenWeekForm] = useState<{
    mode: 'create'
    isHoliday: boolean
  } | null>(null)

  const now = Date.now()
  const futureWeeks = weeks.filter((w) => w.startDate > now && !w.isHoliday)
  const nextWeekCandidate = useMemo(() => {
    if (futureWeeks.length === 0) return null
    return futureWeeks.reduce((min, w) => (w.startDate < min.startDate ? w : min), futureWeeks[0])
  }, [futureWeeks])

  const currentWeek = useQuery(api.weeks.getCurrentWeek, {})
  const startWeek = useMutation(api.weeks.startWeek)

  const onStartWeek = async (weekId: Id<'weeks'>) => {
    const result = await startWeek({ weekId })
    // trigger any refresh if needed by refetching stats on involved weeks
  }

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
          <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-3 text-center opacity-80">
            <Badge variant="secondary">No weeks yet</Badge>
            <p className="text-muted-foreground text-sm">Create your first week to start planning.</p>
            <Button size="sm" onClick={() => setOpenWeekForm({ mode: 'create', isHoliday: false })}>
              <CalendarPlusIcon className="size-4" /> Create Week 1
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            {weeks.map((week) => (
              <WeekColumn
                key={week._id}
                week={week}
                isCurrent={now >= week.startDate && now < week.endDate && !week.isHoliday}
                canStart={nextWeekCandidate?._id === week._id}
                onStartWeek={() => onStartWeek(week._id)}
              />
            ))}
          </div>
        )}
      </div>

      {openWeekForm && (
        <WeekFormSheet
          open={!!openWeekForm}
          onOpenChange={() => setOpenWeekForm(null)}
          isHolidayDefault={openWeekForm.isHoliday}
        />
      )}
    </div>
  )
}

export default TimelineBoard
