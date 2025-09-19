'use client'

import DateTimePicker from '@/components/datetime/date-time-picker'
import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils/date-utils'
import { getTotalGrade } from '@/lib/utils/get-total-grade'
import { zodResolver } from '@hookform/resolvers/zod'
import { Preloaded, useMutation, usePreloadedQuery } from 'convex/react'
import { BookIcon, CalendarIcon, CheckIcon, ScaleIcon, TargetIcon, UserIcon, UsersIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'nextjs-toploader/app'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '../../../../../../convex/_generated/api'
import { assessmentSchema, VALIDATION_LIMITS } from '../../../../../../convex/validation'
import AssessmentActionsMenu from '../../_components/assessment-actions-menu'
import AssessmentDueBadge from '../../_components/assessment-due-badge'
import AssessmentGrades from './assessment-grades'

type AssessmentDetailProps = {
  preloadedDetail: Preloaded<typeof api.assessments.getAssessmentDetail>
}

const AssessmentDetail = ({ preloadedDetail }: AssessmentDetailProps) => {
  const router = useRouter()
  const detail = usePreloadedQuery(preloadedDetail)
  const assessment = detail?.assessment
  const subject = detail?.subject
  const grades = detail?.grades ?? []
  const totalGrade = getTotalGrade(grades)

  const updateAssessment = useMutation(api.assessments.updateAssessment)
  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<z.infer<typeof assessmentSchema>>({
    resolver: zodResolver(assessmentSchema as any),
    values: {
      name: assessment?.name ?? '',
      icon: assessment?.icon ?? '📝',
      contribution: assessment?.contribution ?? 'individual',
      weight: assessment?.weight ?? 0,
      description: assessment?.description ?? '',
      dueDate: assessment?.dueDate ? new Date(assessment.dueDate).getTime() : undefined,
    },
  })

  useEffect(() => {
    if (!detail) {
      router.push('/assessments')
    }
  }, [detail, router])

  useEffect(() => {
    if (!isEditing && assessment) {
      form.reset({
        name: assessment.name ?? '',
        icon: assessment.icon ?? '📝',
        contribution: assessment.contribution ?? 'individual',
        weight: assessment.weight ?? 0,
        description: assessment.description ?? '',
        dueDate: assessment.dueDate ? new Date(assessment.dueDate).getTime() : undefined,
      })
    }
  }, [assessment, isEditing, form])

  if (!assessment || !subject) {
    return null
  }

  const onSubmit = async (data: z.infer<typeof assessmentSchema>) => {
    try {
      await updateAssessment({
        assessmentId: assessment._id,
        name: data.name,
        icon: data.icon,
        contribution: data.contribution,
        weight: data.weight,
        description: data.description,
        dueDate: data.dueDate,
      })
      setIsEditing(false)
    } catch (e: any) {
      toast.error(e?.data || 'Failed to update assessment')
    }
  }

  return (
    <SidebarPage breadcrumb={[{ title: 'Assessments', href: '/assessments' }, { title: detail.assessment.name }]}>
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Header Section */}
            <div className="border-b pb-6">
              <div className="space-y-3">
                {/* Title Row with Action Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{assessment.icon}</span>
                      {isEditing ? (
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...field}
                                  maxLength={VALIDATION_LIMITS.ASSESSMENT_NAME_MAX_LENGTH}
                                  className="h-auto border-none bg-transparent p-0 text-3xl font-bold tracking-tight shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-3xl"
                                  placeholder="Assessment name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <h1 className="line-clamp-2 text-3xl font-bold tracking-tight break-words">
                          {assessment.name}
                        </h1>
                      )}
                      <AssessmentDueBadge assessment={assessment} />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          type="button"
                          onClick={() => {
                            form.reset()
                            setIsEditing(false)
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                        <Button size="icon" type="submit" disabled={form.formState.isSubmitting}>
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <AssessmentActionsMenu assessment={assessment} onEdit={() => setIsEditing(true)} />
                    )}
                  </div>
                </div>

                {/* Subject Link */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/subjects/${subject._id}`}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 overflow-hidden text-sm transition-colors"
                  >
                    <BookIcon className="size-4 shrink-0" />
                    <span className="truncate">{subject.name}</span>
                    {subject.code && <span className="truncate">({subject.code})</span>}
                  </Link>
                </div>

                {/* Assessment info with icons */}
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  {/* Weight */}
                  <div className="flex items-center gap-2">
                    <ScaleIcon className="h-4 w-4" />
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MIN}
                                max={VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX}
                                className="text-muted-foreground h-auto w-16 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                {...field}
                                value={field.value.toString()}
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <span>{assessment.weight}% weight</span>
                    )}
                  </div>

                  {/* Contribution */}
                  <div className="flex items-center gap-2">
                    {assessment.contribution === 'group' ? (
                      <UsersIcon className="h-4 w-4" />
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="contribution"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="text-muted-foreground h-auto border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="individual">Individual</SelectItem>
                                  <SelectItem value="group">Group</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <span className="capitalize">{assessment.contribution}</span>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <DateTimePicker
                                showIcon={false}
                                value={field.value ? new Date(field.value) : undefined}
                                onChange={(date: Date | undefined) => field.onChange(date?.getTime())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <span>{assessment.dueDate ? formatDate(new Date(assessment.dueDate)) : 'No due date'}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  {isEditing ? (
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              maxLength={VALIDATION_LIMITS.ASSESSMENT_DESCRIPTION_MAX_LENGTH}
                              rows={4}
                              className="text-muted-foreground resize-none border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              placeholder="Add a description for this assessment..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed break-words">
                      {assessment.description || 'No description provided.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </Form>
        {/* Progress & Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Grade Overview Card */}
          <BorderedCard>
            <BorderedCardHeader className="justify-between">
              <BorderedCardTitle>Grade Overview</BorderedCardTitle>
              <span className="text-primary text-2xl font-bold">{totalGrade}%</span>
            </BorderedCardHeader>
            <BorderedCardContent className="space-y-4">
              <Progress value={(totalGrade / assessment.weight) * 100} className="h-3" />
              <p className="text-muted-foreground text-xs">
                Total from {grades.length} grade{grades.length !== 1 ? 's' : ''}
              </p>
            </BorderedCardContent>
          </BorderedCard>

          {/* Weight Card */}
          <BorderedCard>
            <BorderedCardHeader className="justify-between">
              <BorderedCardTitle>Weight</BorderedCardTitle>
              <TargetIcon className="h-5 w-5" />
            </BorderedCardHeader>
            <BorderedCardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-2xl font-bold">{assessment.weight}%</div>
                <div className="text-muted-foreground text-xs">of total subject grade</div>
              </div>
            </BorderedCardContent>
          </BorderedCard>
        </div>

        {/* Grades Section */}
        <AssessmentGrades preloadedDetail={preloadedDetail} />
      </div>
    </SidebarPage>
  )
}

export default AssessmentDetail
