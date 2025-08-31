'use client'

import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { Preloaded, useMutation, usePreloadedQuery } from 'convex/react'
import { GraduationCapIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '../../../../../../convex/_generated/api'
import { Id } from '../../../../../../convex/_generated/dataModel'
import { GradeData, gradeSchema, VALIDATION_LIMITS } from '../../../../../../convex/validation'
type AssessmentGradesProps = {
  preloadedDetail: Preloaded<typeof api.assessments.getAssessmentDetail>
}

const AssessmentGrades = ({ preloadedDetail }: AssessmentGradesProps) => {
  const detail = usePreloadedQuery(preloadedDetail)
  const grades = detail?.grades ?? []
  const [editingGradeId, setEditingGradeId] = useState<Id<'grades'> | null>(null)
  const [isAddingGrade, setIsAddingGrade] = useState(false)

  const addGrade = useMutation(api.grades.addGrade)
  const updateGrade = useMutation(api.grades.updateGrade)
  const deleteGrade = useMutation(api.grades.deleteGrade)

  const form = useForm<GradeData>({
    resolver: zodResolver(gradeSchema as any),
    defaultValues: {
      name: '',
      grade: 0,
    },
  })

  const onSubmitGrade = async (data: GradeData) => {
    if (isAddingGrade) {
      if (!detail) return

      try {
        await addGrade({
          name: data.name || undefined,
          grade: data.grade,
          assessmentId: detail.assessment._id,
        })
        form.reset()
        setIsAddingGrade(false)
      } catch (e: any) {
        toast.error(e?.data || 'Failed to add grade.')
      }
    } else if (editingGradeId) {
      try {
        await updateGrade({
          gradeId: editingGradeId,
          name: data.name || undefined,
          grade: data.grade,
        })
        setEditingGradeId(null)
        form.reset()
      } catch (e: any) {
        toast.error(e?.data || 'Failed to update grade.')
      }
    }
  }

  const onDeleteGrade = async (gradeId: Id<'grades'>) => {
    try {
      await deleteGrade({ gradeId })
      if (editingGradeId === gradeId) {
        setEditingGradeId(null)
        form.reset()
      }
    } catch (e: any) {
      toast.error(e?.data || 'Failed to delete grade.')
    }
  }

  const startEditing = (grade: any) => {
    setEditingGradeId(grade._id)
    form.reset({
      name: grade.name || '',
      grade: grade.grade,
    })
    setIsAddingGrade(false)
  }

  const startAdding = () => {
    setIsAddingGrade(true)
    setEditingGradeId(null)
    form.reset({
      name: '',
      grade: 0,
    })
  }

  const cancelForm = () => {
    setIsAddingGrade(false)
    setEditingGradeId(null)
    form.reset()
  }

  const GradeForm = ({ isEditing }: { isEditing: boolean }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitGrade)} className="space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCapIcon className="size-4 shrink-0" />
          <h4 className="text-sm font-medium">{isEditing ? 'Edit Grade' : 'Add New Grade'}</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Grade name" maxLength={VALIDATION_LIMITS.GRADE_NAME_MAX_LENGTH} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Grade (%)"
                    min={VALIDATION_LIMITS.GRADE_MIN}
                    max={VALIDATION_LIMITS.GRADE_MAX}
                    step={0.01}
                    {...field}
                    value={field.value.toString()}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" size="sm">
            {isEditing ? 'Update' : 'Add Grade'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={cancelForm}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )

  return (
    <BorderedCard>
      <BorderedCardHeader className="justify-between">
        <BorderedCardTitle>Grades</BorderedCardTitle>
        <Button variant="outline" size="sm" onClick={startAdding} disabled={isAddingGrade}>
          <PlusIcon className="size-4" /> Add Grade
        </Button>
      </BorderedCardHeader>
      <BorderedCardContent className="space-y-4">
        {/* Add new grade form */}
        {isAddingGrade && <GradeForm isEditing={false} />}

        {/* Existing grades */}
        {grades.length > 0 ? (
          <div className="space-y-3">
            {grades.map((grade) => (
              <div key={grade._id} className="rounded-lg border p-4">
                {editingGradeId === grade._id ? (
                  <GradeForm isEditing={true} />
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 overflow-x-hidden">
                      <GraduationCapIcon className="size-6 shrink-0" />
                      <div className="space-y-1 overflow-x-hidden">
                        <h4 className="line-clamp-2 text-sm font-medium break-words">{grade.name || 'Grade'}</h4>
                        <div className="text-primary text-lg font-semibold">{grade.grade}%</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(grade)}
                        disabled={editingGradeId !== null || isAddingGrade}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteGrade(grade._id)}
                        disabled={editingGradeId !== null || isAddingGrade}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !isAddingGrade ? (
          <div className="py-8 text-center">
            <GraduationCapIcon className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No grades yet</h3>
            <p className="text-muted-foreground mt-2">Add grades to track your performance on this assessment.</p>
          </div>
        ) : null}
      </BorderedCardContent>
    </BorderedCard>
  )
}

export default AssessmentGrades
