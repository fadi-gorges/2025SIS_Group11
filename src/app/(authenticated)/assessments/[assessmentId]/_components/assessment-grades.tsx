'use client'

import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import { Button } from '@/components/ui/button'
import { Preloaded, usePreloadedQuery } from 'convex/react'
import { GraduationCapIcon, PlusIcon } from 'lucide-react'
import { api } from '../../../../../../convex/_generated/api'
import { GradeFormSheet } from './grade-form-sheet'

type AssessmentGradesProps = {
  preloadedDetail: Preloaded<typeof api.assessments.getAssessmentDetail>
}

const AssessmentGrades = ({ preloadedDetail }: AssessmentGradesProps) => {
  const detail = usePreloadedQuery(preloadedDetail)
  const grades = detail?.grades ?? []
  const assessmentId = detail?.assessment._id

  if (!assessmentId) {
    return null
  }

  return (
    <BorderedCard>
      <BorderedCardHeader className="justify-between">
        <BorderedCardTitle>Grades</BorderedCardTitle>
        <GradeFormSheet
          button={
            <Button variant="outline" size="sm">
              <PlusIcon className="size-4" /> Add Grade
            </Button>
          }
          assessmentId={assessmentId}
        />
      </BorderedCardHeader>
      <BorderedCardContent className="space-y-4">
        {grades.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grades.map((grade) => (
              <div key={grade._id} className="hover:bg-muted/50 space-y-3 rounded-lg border p-4 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <GraduationCapIcon className="size-4 shrink-0" />
                      <h4 className="truncate text-sm font-medium">{grade.name}</h4>
                    </div>
                    <div className="text-primary text-2xl font-bold">{grade.grade}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <GraduationCapIcon className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No grades yet</h3>
            <p className="text-muted-foreground mt-2">Add grades to track your performance on this assessment.</p>
          </div>
        )}
      </BorderedCardContent>
    </BorderedCard>
  )
}

export default AssessmentGrades
