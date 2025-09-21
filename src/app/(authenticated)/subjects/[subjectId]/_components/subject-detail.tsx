'use client'

import AssessmentList from '@/app/(authenticated)/assessments/_components/assessment-list'
import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { getTotalGrade } from '@/lib/utils/grade-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Preloaded, useMutation, usePreloadedQuery } from 'convex/react'
import { BookIcon, CalendarIcon, CheckIcon, FileTextIcon, HashIcon, MailIcon, UserIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'nextjs-toploader/app'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '../../../../../../convex/_generated/api'
import { subjectSchema, VALIDATION_LIMITS } from '../../../../../../convex/validation'
import SubjectActionsMenu from '../../_components/subject-actions-menu'

type SubjectDetailProps = {
  preloadedSubject: Preloaded<typeof api.subjects.getSubjectById>
  preloadedAssessments: Preloaded<typeof api.assessments.getAssessmentsByUser>
  preloadedGrades: Preloaded<typeof api.grades.getGradesByUser>
}

const SubjectDetail = ({ preloadedSubject, preloadedAssessments, preloadedGrades }: SubjectDetailProps) => {
  const router = useRouter()

  const subject = usePreloadedQuery(preloadedSubject)
  const updateSubject = useMutation(api.subjects.updateSubject)

  const assessments = usePreloadedQuery(preloadedAssessments)
  const grades = usePreloadedQuery(preloadedGrades)
  const totalGrade = getTotalGrade(grades)

  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema as any),
    values: {
      name: subject?.name ?? '',
      code: subject?.code ?? '',
      description: subject?.description ?? '',
      term: subject?.term ?? '',
      coordinatorName: subject?.coordinatorName ?? '',
      coordinatorEmail: subject?.coordinatorEmail ?? '',
    },
  })

  useEffect(() => {
    if (!subject) {
      router.push('/subjects')
    }
  }, [subject, router])

  useEffect(() => {
    if (!isEditing && subject) {
      form.reset({
        name: subject.name ?? '',
        code: subject.code ?? '',
        description: subject.description ?? '',
        term: subject.term ?? '',
        coordinatorName: subject.coordinatorName ?? '',
        coordinatorEmail: subject.coordinatorEmail ?? '',
      })
    }
  }, [subject, isEditing, form])

  if (!subject) {
    return null
  }

  const onSubmit = async (data: z.infer<typeof subjectSchema>) => {
    try {
      await updateSubject({
        subjectId: subject._id,
        name: data.name,
        code: data.code || undefined,
        description: data.description || undefined,
        term: data.term || undefined,
        coordinatorName: data.coordinatorName || undefined,
        coordinatorEmail: data.coordinatorEmail || undefined,
      })
      setIsEditing(false)
    } catch (e: any) {
      toast.error(e?.data || 'Failed to update subject.')
    }
  }

  return (
    <SidebarPage breadcrumb={[{ title: 'Subjects', href: '/subjects' }, { title: subject.name }]}>
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
                      {isEditing ? (
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...field}
                                  maxLength={VALIDATION_LIMITS.SUBJECT_NAME_MAX_LENGTH}
                                  className="h-auto border-none bg-transparent p-0 text-3xl font-bold tracking-tight shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-3xl"
                                  placeholder="Subject name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <>
                          <BookIcon className="size-6 shrink-0" />
                          <h1 className="line-clamp-2 text-3xl font-bold tracking-tight break-words">{subject.name}</h1>
                        </>
                      )}
                      {subject.archived && (
                        <Badge variant="secondary" className="text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isEditing ? (
                      <div>
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
                      </div>
                    ) : (
                      <SubjectActionsMenu subject={subject} onEdit={() => setIsEditing(true)} />
                    )}
                  </div>
                </div>

                {/* Subject info with icons */}
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  {/* Code */}
                  <div className="flex items-center gap-2 overflow-hidden">
                    <HashIcon className="size-4 shrink-0" />
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                maxLength={VALIDATION_LIMITS.SUBJECT_CODE_MAX_LENGTH}
                                className="text-muted-foreground h-auto w-20 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="Code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <span className="truncate">{subject.code || 'No code'}</span>
                    )}
                  </div>

                  {/* Term */}
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CalendarIcon className="size-4 shrink-0" />
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="term"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                maxLength={VALIDATION_LIMITS.SUBJECT_TERM_MAX_LENGTH}
                                className="text-muted-foreground h-auto w-32 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="Term"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <span className="truncate">{subject.term || 'No term set'}</span>
                    )}
                  </div>

                  {/* Coordinator Name */}
                  {(isEditing || subject.coordinatorName) && (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <UserIcon className="size-4 shrink-0" />
                      {isEditing ? (
                        <FormField
                          control={form.control}
                          name="coordinatorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="text-muted-foreground h-auto w-32 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                  placeholder="Coordinator"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <span className="truncate">{subject.coordinatorName}</span>
                      )}
                    </div>
                  )}

                  {/* Coordinator Email */}
                  {(isEditing || subject.coordinatorEmail) && (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MailIcon className="size-4 shrink-0" />
                      {isEditing ? (
                        <FormField
                          control={form.control}
                          name="coordinatorEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  className="text-muted-foreground h-auto w-40 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                  placeholder="Email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <span className="truncate">{subject.coordinatorEmail}</span>
                      )}
                    </div>
                  )}
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
                              maxLength={VALIDATION_LIMITS.SUBJECT_DESCRIPTION_MAX_LENGTH}
                              rows={4}
                              className="text-muted-foreground resize-none border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              placeholder="Add a description for this subject..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <p
                      className="text-muted-foreground overflow-hidden text-sm leading-relaxed"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {subject.description || 'No description provided.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </Form>

        {/* Progress & Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Progress Card */}
          <BorderedCard>
            <BorderedCardHeader className="justify-between">
              <BorderedCardTitle>Overall Grade</BorderedCardTitle>
            </BorderedCardHeader>
            <BorderedCardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Progress value={totalGrade} className="h-3" />
                <span className="text-primary text-2xl font-bold">{totalGrade ?? 0}%</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Based on {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
              </p>
            </BorderedCardContent>
          </BorderedCard>

          {/* Assessments Card */}
          <BorderedCard>
            <BorderedCardHeader className="justify-between">
              <BorderedCardTitle>Assessments</BorderedCardTitle>
              <FileTextIcon className="h-5 w-5" />
            </BorderedCardHeader>
            <BorderedCardContent className="space-y-4">
              <div className="text-2xl font-bold">{assessments.length}</div>
              <div className="text-muted-foreground text-xs">
                {assessments.filter((a) => a.complete).length} complete
              </div>
            </BorderedCardContent>
          </BorderedCard>
        </div>

        {/* Assessments Overview */}
        <BorderedCard>
          <BorderedCardHeader className="justify-between">
            <BorderedCardTitle>Assessments</BorderedCardTitle>
            <Link
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              href={`/assessments?subject=${subject._id}`}
            >
              View All
            </Link>
          </BorderedCardHeader>
          <BorderedCardContent className="space-y-4 p-3">
            <AssessmentList
              preloadedAssessments={preloadedAssessments}
              preloadedGrades={preloadedGrades}
              hasFilter={false}
              itemsPerPage={3}
              showSubject={false}
            />
          </BorderedCardContent>
        </BorderedCard>
      </div>
    </SidebarPage>
  )
}

export default SubjectDetail
