'use client'

import { DataLayout, GridItem, ListItem } from '@/components/extensions/data-layout'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DetailAssessment } from '@/lib/types'
import { formatDate } from '@/lib/utils/date-utils'
import { getTotalGrade } from '@/lib/utils/grade-utils'
import { Preloaded, usePreloadedQuery, useQuery } from 'convex/react'
import { BookIcon, CalendarIcon, FileTextIcon, PlusIcon, ScaleIcon } from 'lucide-react'
import { api } from '../../../../../convex/_generated/api'
import { AssessmentActionsMenu } from './assessment-actions-menu'
import AssessmentDueBadge from './assessment-due-badge'
import AssessmentFormSheet from './assessment-form-sheet'

export const AssessmentList = ({
  preloadedAssessments,
  preloadedGrades,
  hasFilter,
  itemsPerPage,
  showSubject = true,
}: {
  preloadedAssessments: Preloaded<typeof api.assessments.getAssessmentsByUser>
  preloadedGrades: Preloaded<typeof api.grades.getGradesByUser>
  hasFilter: boolean
  itemsPerPage?: number
  showSubject?: boolean
}) => {
  const assessments = usePreloadedQuery(preloadedAssessments)
  const grades = usePreloadedQuery(preloadedGrades)
  const subjects = useQuery(api.subjects.getSubjectsByUser, { archived: false })

  const detailAssessments = assessments.map((assessment) => {
    const subject = subjects?.find((subject) => subject._id === assessment.subjectId)
    return {
      ...assessment,
      subject,
    }
  })

  const renderGridItem = (assessment: DetailAssessment) => {
    const assessmentGrades = grades.filter((grade) => grade.assessmentId === assessment._id)
    const totalGrade = getTotalGrade(assessmentGrades)
    const dueDate = assessment.dueDate ? formatDate(new Date(assessment.dueDate)) : 'N/A'
    return (
      <GridItem
        key={assessment._id}
        href={`/assessments/${assessment._id}`}
        actions={<AssessmentActionsMenu assessment={assessment} />}
      >
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-lg">{assessment.icon}</span>
              <p className="line-clamp-2 text-base font-medium break-words">{assessment.name}</p>
            </div>
            {showSubject && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <BookIcon className="size-4 shrink-0" />
                <p className="truncate">{assessment.subject?.name || 'No Subject'}</p>
              </div>
            )}
          </div>
          <div className="-mr-10 space-y-3">
            <Separator />
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-1 overflow-hidden">
                <ScaleIcon className="size-4 shrink-0" />
                <p className="truncate">
                  {!!totalGrade && `${totalGrade}/`}
                  {assessment.weight}%
                </p>
              </div>
              <div className="flex items-center gap-1 overflow-hidden">
                <CalendarIcon className="size-4 shrink-0" />
                <p className="truncate">{dueDate}</p>
              </div>
            </div>
            <AssessmentDueBadge assessment={assessment} />
          </div>
        </div>
      </GridItem>
    )
  }

  const renderListItem = (assessment: DetailAssessment) => {
    const dueDate = assessment.dueDate ? formatDate(new Date(assessment.dueDate)) : 'N/A'
    return (
      <ListItem
        key={assessment._id}
        href={`/assessments/${assessment._id}`}
        actions={<AssessmentActionsMenu assessment={assessment} />}
        className="h-28"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{assessment.icon}</span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <p className="truncate text-base font-medium">{assessment.name}</p>
              <AssessmentDueBadge assessment={assessment} />
            </div>
            {showSubject && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <BookIcon className="size-4 shrink-0" />
                <p className="truncate">{assessment.subject?.name || 'No Subject'}</p>
              </div>
            )}
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 overflow-hidden">
                <ScaleIcon className="size-4 shrink-0" />
                <p className="truncate">{assessment.weight}%</p>
              </div>
              <div className="flex items-center gap-1 overflow-hidden">
                <CalendarIcon className="size-4 shrink-0" />
                <p className="truncate">{dueDate}</p>
              </div>
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
      data={detailAssessments}
      renderGridItem={renderGridItem}
      renderListItem={renderListItem}
      emptyState={emptyState}
      itemsPerPage={itemsPerPage}
    />
  )
}

export default AssessmentList
