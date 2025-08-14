'use client'

import { DataLayout, GridItem, ListItem } from '@/components/extensions/data-layout'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils/format-date'
import { useQuery } from 'convex/react'
import { CalendarIcon, FileTextIcon, PlusIcon, ScaleIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'
import { Doc } from '../../../../../convex/_generated/dataModel'
import { AssessmentActionsMenu } from './assessment-actions-menu'
import AssessmentDueBadge from './assessment-due-badge'
import AssessmentFormSheet from './assessment-form-sheet'

export const AssessmentList = () => {
  const params = useSearchParams()
  const search = params.get('search') ?? ''
  const complete = (params.get('complete') as 'incomplete' | 'complete' | 'all' | undefined) ?? 'all'
  const subjectId = params.get('subject') ?? null
  const hasFilter = !!search || complete !== 'all' || !!subjectId

  const assessments = useQuery(api.assessments.getAssessmentsByUser, {
    search,
    complete: complete === 'all' ? undefined : complete === 'complete',
    subjectId: subjectId as any,
  })

  const renderGridItem = (assessment: Doc<'assessments'>) => {
    const dueDate = assessment.dueDate ? formatDate(new Date(assessment.dueDate)) : 'N/A'
    return (
      <GridItem
        key={assessment._id}
        href={`/assessments/${assessment._id}`}
        actions={<AssessmentActionsMenu assessment={assessment} />}
      >
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-lg">{assessment.icon}</span>
              <p className="truncate text-base font-medium">{assessment.name}</p>
            </div>
            <AssessmentDueBadge assessment={assessment} />
          </div>
          <div className="-mr-10 space-y-3">
            <Separator />
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-1">
                <ScaleIcon className="size-4" />
                <p className="truncate">{assessment.weight}%</p>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="size-4" />
                <p className="truncate">{dueDate}</p>
              </div>
            </div>
          </div>
        </div>
      </GridItem>
    )
  }

  const renderListItem = (assessment: Doc<'assessments'>) => {
    const dueDate = assessment.dueDate ? formatDate(new Date(assessment.dueDate)) : null
    return (
      <ListItem
        key={assessment._id}
        href={`/assessments/${assessment._id}`}
        actions={<AssessmentActionsMenu assessment={assessment} />}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{assessment.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-medium">{assessment.name}</p>
              <AssessmentDueBadge assessment={assessment} />
            </div>
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <ScaleIcon className="size-4" />
                <p className="truncate">{assessment.weight}%</p>
              </div>
              {dueDate && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="size-4" />
                  <p className="truncate">{dueDate}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ListItem>
    )
  }

  const emptyState = hasFilter
    ? {
        title: 'No assessments found',
        description: 'Try adjusting your search or filters.',
        icon: FileTextIcon,
      }
    : {
        title: 'No assessments yet',
        description: 'Get started by creating your first assessment.',
        icon: FileTextIcon,
        button: (
          <AssessmentFormSheet
            button={
              <Button size="sm">
                <PlusIcon className="size-4" /> Add Assessment
              </Button>
            }
          />
        ),
      }

  return (
    <DataLayout
      data={assessments}
      renderGridItem={renderGridItem}
      renderListItem={renderListItem}
      emptyState={emptyState}
    />
  )
}

export default AssessmentList
