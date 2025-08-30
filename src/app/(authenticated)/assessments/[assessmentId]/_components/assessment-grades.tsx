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
import { useState } from 'react'
import { api } from '../../../../../../convex/_generated/api'
import { GradeFormSheet } from './grade-form-sheet'
import { GradeItem } from './grade-item'
import { EditGradeSheet } from './edit-grade-sheet'

type AssessmentGradesProps = {
  preloadedDetail: Preloaded<typeof api.assessments.getAssessmentDetail>
}

const AssessmentGrades = ({ preloadedDetail }: AssessmentGradesProps) => {
  const detail = usePreloadedQuery(preloadedDetail)
  const grades = detail?.grades ?? []
  const assessmentId = detail?.assessment._id
  const [editingGrade, setEditingGrade] = useState<any>(null)

  if (!assessmentId) {
    return null
  }

  const handleEditGrade = (grade: any) => {
    setEditingGrade(grade)
  }

  const handleGradeSuccess = () => {
    setEditingGrade(null)
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
          onSuccess={handleGradeSuccess}
        />
      </BorderedCardHeader>
      <BorderedCardContent className="space-y-4">
        {grades.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grades.map((grade) => (
              <GradeItem
                key={grade._id}
                grade={grade}
                onEdit={() => handleEditGrade(grade)}
                onDelete={handleGradeSuccess}
              />
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

      {/* Edit Grade Sheet */}
      {editingGrade && (
        <EditGradeSheet
          grade={editingGrade}
          open={!!editingGrade}
          onOpenChange={(open) => !open && setEditingGrade(null)}
          onSuccess={handleGradeSuccess}
        />
      )}
    </BorderedCard>
  )
}

export default AssessmentGrades
