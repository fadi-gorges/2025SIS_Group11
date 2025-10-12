'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, CalendarDays, CheckCircle2, ChevronRight, FileTextIcon, Star, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { formatDate } from '@/lib/utils/date-utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

const PriorityBadge = ({ priority }: { priority: 'none' | 'low' | 'medium' | 'high' }) => {
  const map = {
    none: { label: 'None', variant: 'secondary' as const },
    low: { label: 'Low', variant: 'outline' as const },
    medium: { label: 'Medium', variant: 'default' as const },
    high: { label: 'High', variant: 'destructive' as const },
  }
  const p = map[priority]
  return <Badge variant={p.variant}>{p.label}</Badge>
}

const formatDue = (ts?: number) => {
  if (!ts) return 'No due date'
  const diff = ts - Date.now()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Due today'
  if (days > 0) return `Due in ${days} day${days === 1 ? '' : 's'}`
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
}

const DashboardContent = () => {
  const router = useRouter()
  const dashboardData = useQuery(api.dashboard.getDashboardData, {})
  
  // Show loading state while data is being fetched
  if (dashboardData === undefined) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-7">
          <Card className="lg:col-span-4 animate-pulse">
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 animate-pulse">
            <CardHeader>
              <div className="h-6 w-24 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Unable to load dashboard data</h3>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const { subjects, upcomingAssessments, tasksSummary, tasksByStatus, recentGrades, averageGrade } = dashboardData

  // Create subject map for quick lookups
  const subjectMap = useMemo(() => 
    Object.fromEntries(subjects.map(s => [s._id, s])), 
    [subjects]
  )

  // Create assessment map for task lookups
  const assessmentMap = useMemo(() => 
    Object.fromEntries(upcomingAssessments.map(a => [a._id, a])), 
    [upcomingAssessments]
  )

  const taskProgress = tasksSummary.totalTasks 
    ? Math.round((tasksSummary.doneTasks / tasksSummary.totalTasks) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Top row: heading and quick stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Plan, track, and ace your term.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/calendar')}>
            <CalendarDays className="mr-2 h-4 w-4" /> Calendar
          </Button>
          <Button size="sm" onClick={() => router.push('/tasks')}>New Task</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Subjects"
          value={subjects.length}
          icon={<BookOpen className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Assessments Due"
          value={upcomingAssessments.length}
          icon={<FileTextIcon className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Tasks Completed"
          value={`${tasksSummary.doneTasks}/${tasksSummary.totalTasks}`}
          icon={<CheckCircle2 className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Average Grade"
          value={averageGrade !== null ? `${averageGrade}%` : '—'}
          icon={<TrendingUp className="text-muted-foreground h-4 w-4" />}
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
            <Button variant="ghost" size="sm" onClick={() => router.push('/assessments')}>
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {upcomingAssessments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileTextIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No upcoming assessments</p>
                  </div>
                ) : (
                  upcomingAssessments.map((assessment) => {
                    const subject = subjectMap[assessment.subjectId]
                    return (
                      <div 
                        key={assessment._id} 
                        className="hover:bg-accent/40 rounded-md border p-4 cursor-pointer transition-colors"
                        onClick={() => router.push(`/assessments/${assessment._id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl" aria-hidden>
                                {assessment.icon}
                              </span>
                              <h3 className="leading-none font-medium">{assessment.name}</h3>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {subject?.code} • {subject?.name} • {assessment.contribution === 'group' ? 'Group' : 'Individual'}
                            </p>
                          </div>
                          <div className="space-y-2 text-right">
                            <Badge variant="secondary">{assessment.weight}%</Badge>
                            <div className="text-muted-foreground text-xs">{formatDue(assessment.dueDate)}</div>
                          </div>
                        </div>
                      </div>
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
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">Overall progress</div>
                <div className="flex items-center gap-2">
                  <Progress value={taskProgress} className="w-40" />
                  <span className="text-muted-foreground w-10 text-right text-sm">{taskProgress}%</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
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
                  {tasksByStatus[status].length === 0 ? (
                    <div className="text-muted-foreground text-sm">No tasks here.</div>
                  ) : (
                    tasksByStatus[status].slice(0, 3).map((task) => {
                      const assessment = task.assessmentId ? assessmentMap[task.assessmentId] : null
                      const subject = assessment ? subjectMap[assessment.subjectId] : null
                      return (
                        <div 
                          key={task._id} 
                          className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-accent/40 transition-colors"
                          onClick={() => router.push('/tasks')}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <PriorityBadge priority={task.priority} />
                              <span className="truncate font-medium">{task.name}</span>
                            </div>
                            <p className="text-muted-foreground mt-1 truncate text-xs">
                              {assessment?.name} {subject ? `• ${subject.code}` : ''}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" aria-label="open">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
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
            {averageGrade !== null && (
              <div className="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Average</span>
                </div>
                <span className="font-semibold">{averageGrade}%</span>
              </div>
            )}
            <div className="space-y-3">
              {recentGrades.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Star className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No grades yet</p>
                </div>
              ) : (
                recentGrades.map((grade) => {
                  const assessment = upcomingAssessments.find(a => a._id === grade.assessmentId)
                  const subject = assessment ? subjectMap[assessment.subjectId] : undefined
                  return (
                    <div 
                      key={grade._id} 
                      className="rounded-md border p-3 cursor-pointer hover:bg-accent/40 transition-colors"
                      onClick={() => router.push(`/assessments/${grade.assessmentId}`)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{grade.name || 'Unnamed Grade'}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {subject?.code} • {subject?.name}
                          </div>
                        </div>
                        <Badge variant="secondary">{grade.grade}%</Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Subjects</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/subjects')}>
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No subjects yet</p>
                  <p className="text-sm">Create your first subject to get started</p>
                </div>
              ) : (
                subjects.map((subject) => {
                  const subjectAssessments = upcomingAssessments.filter(a => a.subjectId === subject._id)
                  const completed = subjectAssessments.filter(a => a.complete).length
                  const progress = subjectAssessments.length
                    ? Math.round((completed / subjectAssessments.length) * 100)
                    : 0
                  const initials = (subject.code ?? subject.name)
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  return (
                    <div 
                      key={subject._id} 
                      className="rounded-md border p-4 cursor-pointer hover:bg-accent/40 transition-colors"
                      onClick={() => router.push(`/subjects/${subject._id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {subject.code} • {subject.name}
                            </div>
                            <div className="text-muted-foreground truncate text-xs">
                              Coordinator: {subject.coordinatorName ?? '—'}
                            </div>
                          </div>
                        </div>
                        <div className="w-40">
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
                          <FileTextIcon className="h-3.5 w-3.5" /> {subjectAssessments.length} assessments
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {completed} completed
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> Term {subject.term}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardContent
