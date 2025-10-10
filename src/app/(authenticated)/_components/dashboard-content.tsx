'use client'

import Heading from '@/components/page/heading'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Preloaded, usePreloadedQuery } from 'convex/react'
import { BookOpen, CalendarDays, CheckCircle2, ChevronRight, FileTextIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { api } from '../../../../convex/_generated/api'
import { Doc } from '../../../../convex/_generated/dataModel'
import TaskDialog from '../tasks/_components/task-dialog'

type DashboardContentProps = {
  preloadedSubjects: Preloaded<typeof api.subjects.getSubjectsByUser>
  preloadedAssessments: Preloaded<typeof api.assessments.getAssessmentsByUser>
  preloadedTasks: Preloaded<typeof api.tasks.getTasksForCurrentWeekKanban>
  preloadedGrades: Preloaded<typeof api.grades.getGradesByUser>
}

const formatDue = (ts?: number) => {
  if (!ts) return 'No due date'
  const diff = ts - Date.now()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Due today'
  if (days > 0) return `Due in ${days} day${days === 1 ? '' : 's'}`
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
}

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <Card className="transition-shadow hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
)

const PriorityBadge = ({ priority }: { priority: Doc<'tasks'>['priority'] }) => {
  const map = {
    none: { label: 'None', variant: 'secondary' as const },
    low: { label: 'Low', variant: 'outline' as const },
    medium: { label: 'Medium', variant: 'default' as const },
    high: { label: 'High', variant: 'destructive' as const },
  }
  const p = map[priority]
  return <Badge variant={p.variant}>{p.label}</Badge>
}

const DashboardContent = ({
  preloadedSubjects,
  preloadedAssessments,
  preloadedTasks,
  preloadedGrades,
}: DashboardContentProps) => {
  const subjects = usePreloadedQuery(preloadedSubjects)
  const assessments = usePreloadedQuery(preloadedAssessments)
  const tasks = usePreloadedQuery(preloadedTasks)
  const grades = usePreloadedQuery(preloadedGrades)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  const subjectMap = useMemo(() => {
    return Object.fromEntries(subjects.map((s) => [s._id, s]))
  }, [subjects])

  const assessmentMap = useMemo(() => {
    return Object.fromEntries(assessments.map((a) => [a._id, a]))
  }, [assessments])

  const upcoming = useMemo(
    () => assessments.filter((a) => !a.complete).slice(0, 5), // Filter incomplete and take first 5
    [assessments],
  )

  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks?.tasks.filter((t) => t.status === 'todo'),
      doing: tasks?.tasks.filter((t) => t.status === 'doing'),
      done: tasks?.tasks.filter((t) => t.status === 'done'),
    }
  }, [tasks])

  const completedTasks = tasksByStatus.done?.length ?? 0
  const totalTasks = tasks?.tasks.length ?? 0
  const taskProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Top row: heading and quick stats */}
      <Heading title="Dashboard" description="Plan, track, and ace your term." />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active Subjects"
          value={subjects.length}
          icon={<BookOpen className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Assessments Due"
          value={assessments.filter((a) => !a.complete).length}
          icon={<FileTextIcon className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Tasks Completed"
          value={`${completedTasks}/${totalTasks}`}
          icon={<CheckCircle2 className="text-muted-foreground h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        {/* Upcoming assessments */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming assessments</CardTitle>
              <p className="text-muted-foreground text-sm">Next deadlines and weights</p>
            </div>
            <Link href="/assessments">
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {upcoming.length === 0 ? (
                  <div className="text-muted-foreground text-center text-sm">No upcoming assessments</div>
                ) : (
                  upcoming.map((a) => {
                    const subject = subjectMap[a.subjectId]
                    return (
                      <Link key={a._id} href={`/assessments/${a._id}`}>
                        <div className="hover:bg-accent/40 cursor-pointer rounded-md border p-4 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xl" aria-hidden>
                                  {a.icon}
                                </span>
                                <h3 className="truncate leading-none font-medium">{a.name}</h3>
                              </div>
                              <p className="text-muted-foreground truncate text-sm">
                                {subject?.code} • {subject?.name} •{' '}
                                {a.contribution === 'group' ? 'Group' : 'Individual'}
                              </p>
                            </div>
                            <div className="ml-4 space-y-2 text-right">
                              <Badge variant="secondary">{a.weight}%</Badge>
                              <div className="text-muted-foreground text-xs">{formatDue(a.dueDate)}</div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tasks preview */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tasks overview</CardTitle>
              <p className="text-muted-foreground text-sm">Quick glance at your progress</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Overall progress</div>
              <div className="flex items-center gap-2">
                <Progress value={taskProgress} className="w-40" />
                <span className="text-muted-foreground w-10 text-right text-sm">{taskProgress}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todo">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="todo">To do</TabsTrigger>
                <TabsTrigger value="doing">Doing</TabsTrigger>
                <TabsTrigger value="done">Done</TabsTrigger>
              </TabsList>
              {(['todo', 'doing', 'done'] as const).map((status) => (
                <TabsContent key={status} value={status} className="space-y-3">
                  {!tasksByStatus[status]?.length ? (
                    <div className="text-muted-foreground text-sm">No tasks here.</div>
                  ) : (
                    tasksByStatus[status]?.map((t) => {
                      const a = t.assessmentId ? assessmentMap[t.assessmentId] : undefined
                      const s = a ? subjectMap[a.subjectId] : t.subjectId ? subjectMap[t.subjectId] : undefined
                      return (
                        <div
                          key={t._id}
                          className="hover:bg-accent/40 flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors"
                          onClick={() => {
                            setSelectedTaskId(t._id)
                            setIsTaskDialogOpen(true)
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <PriorityBadge priority={t.priority} />
                              <span className="truncate font-medium">{t.name}</span>
                            </div>
                            <p className="text-muted-foreground mt-1 truncate text-xs">
                              {s ? `${s.name} • ${s.code}` : ''}
                            </p>
                          </div>
                          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                        </div>
                      )
                    })
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        {/* Grades and subjects */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent grades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {grades.length === 0 ? (
                <div className="text-muted-foreground text-sm">No grades yet</div>
              ) : (
                grades.slice(0, 5).map((g) => {
                  const a = g.assessmentId ? assessmentMap[g.assessmentId] : undefined
                  const s = a ? subjectMap[a.subjectId] : g.subjectId ? subjectMap[g.subjectId] : undefined
                  const content = (
                    <div className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{g.name || a?.name || 'Grade'}</div>
                          {s && (
                            <div className="text-muted-foreground truncate text-xs">
                              {s.code} • {s.name}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary">{g.grade}%</Badge>
                      </div>
                    </div>
                  )

                  return g.assessmentId ? (
                    <Link key={g._id} href={`/assessments/${g.assessmentId}`} className="block">
                      <div className="hover:bg-accent/40 cursor-pointer rounded-md border p-3 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{g.name || a?.name || 'Grade'}</div>
                            {s && (
                              <div className="text-muted-foreground truncate text-xs">
                                {s.code} • {s.name}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">{g.grade}%</Badge>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div key={g._id}>{content}</div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subjects</CardTitle>
            <Link href="/subjects">
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjects.length === 0 ? (
                <div className="text-muted-foreground text-sm">No subjects yet</div>
              ) : (
                subjects.map((s) => {
                  const subjectAssessments = assessments.filter((a) => a.subjectId === s._id)
                  const allSubjectAssessments = [...subjectAssessments]
                  const completed = allSubjectAssessments.filter((a) => a.complete).length
                  const progress = allSubjectAssessments.length
                    ? Math.round((completed / allSubjectAssessments.length) * 100)
                    : 0
                  const initials = (s.code ?? s.name)
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  return (
                    <Link key={s._id} href={`/subjects/${s._id}`}>
                      <div className="hover:bg-accent/40 cursor-pointer rounded-md border p-4 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {s.code} • {s.name}
                              </div>
                              <div className="text-muted-foreground truncate text-xs">
                                Coordinator: {s.coordinatorName ?? '—'}
                              </div>
                            </div>
                          </div>
                          <div className="w-40 shrink-0">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} />
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1">
                            <FileTextIcon className="h-3.5 w-3.5" /> {allSubjectAssessments.length} assessments
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {completed} completed
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" /> {s.term ?? '—'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Dialog */}
      <TaskDialog taskId={selectedTaskId} open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen} />
    </div>
  )
}

export default DashboardContent
