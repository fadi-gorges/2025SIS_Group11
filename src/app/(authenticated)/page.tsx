'use client'

import Heading from '@/components/page/heading'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Star, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'

// Mock data shaped according to convex/schema.ts entities
const mockSubjects = [
  {
    _id: 'subj_1',
    name: 'Algorithms',
    code: 'COMP3001',
    term: 'T2',
    archived: false,
    coordinatorName: 'Dr. Smith',
  },
  {
    _id: 'subj_2',
    name: 'Databases',
    code: 'COMP3300',
    term: 'T2',
    archived: false,
    coordinatorName: 'Prof. Garcia',
  },
  {
    _id: 'subj_3',
    name: 'Human-Computer Interaction',
    code: null,
    term: 'T2',
    archived: false,
    coordinatorName: 'Dr. Lin',
  },
] as const

const mockAssessments = [
  {
    _id: 'assess_1',
    name: 'A2: Graph Algorithms Project',
    icon: '🧠',
    contribution: 'group',
    weight: 30,
    description: 'Implement and analyze graph algorithms.',
    dueDate: Date.now() + 1000 * 60 * 60 * 24 * 3, // in 3 days
    complete: false,
    subjectId: 'subj_1',
  },
  {
    _id: 'assess_2',
    name: 'DB Design Assignment',
    icon: '🗄️',
    contribution: 'individual',
    weight: 20,
    description: 'ER modeling and normalization.',
    dueDate: Date.now() + 1000 * 60 * 60 * 24 * 7, // in 7 days
    complete: false,
    subjectId: 'subj_2',
  },
  {
    _id: 'assess_3',
    name: 'HCI Usability Report',
    icon: '🧪',
    contribution: 'group',
    weight: 25,
    description: 'Evaluate usability of a mobile app.',
    dueDate: Date.now() - 1000 * 60 * 60 * 24 * 1, // 1 day ago
    complete: true,
    subjectId: 'subj_3',
  },
] as const

const mockTasks = [
  { _id: 'task_1', name: 'Design schema', status: 'doing', priority: 'high', assessmentId: 'assess_2' },
  { _id: 'task_2', name: 'Run Dijkstra benchmarks', status: 'todo', priority: 'medium', assessmentId: 'assess_1' },
  { _id: 'task_3', name: 'Write test plan', status: 'todo', priority: 'low', assessmentId: 'assess_1' },
  { _id: 'task_4', name: 'Heuristic evaluation draft', status: 'done', priority: 'none', assessmentId: 'assess_3' },
] as const

const mockGrades = [
  { _id: 'grade_1', assessmentId: 'assess_3', name: 'Usability Report', grade: 82 },
  { _id: 'grade_2', assessmentId: 'assess_2', name: 'DB ER Diagram (Part A)', grade: 88 },
] as const

const byId = <T extends { _id: string }>(arr: readonly T[]) =>
  Object.fromEntries(arr.map((a) => [a._id, a])) as Record<string, T>

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

const DashboardPage = () => {
  const subjectMap = useMemo(() => byId(mockSubjects), [])

  const upcoming = useMemo(
    () =>
      [...mockAssessments]
        .filter((a) => !a.complete)
        .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
        .slice(0, 5),
    [],
  )

  const tasksByStatus = useMemo(() => {
    return {
      todo: mockTasks.filter((t) => t.status === 'todo'),
      doing: mockTasks.filter((t) => t.status === 'doing'),
      done: mockTasks.filter((t) => t.status === 'done'),
    } as const
  }, [])

  const avgGrade = useMemo(() => {
    if (!mockGrades.length) return null
    const sum = mockGrades.reduce((acc, g) => acc + g.grade, 0)
    return Math.round((sum / mockGrades.length) * 10) / 10
  }, [])

  const completedTasks = tasksByStatus.done.length
  const totalTasks = mockTasks.length
  const taskProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <SidebarPage>
      <div className="space-y-6">
        {/* Top row: heading and quick stats */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Heading title="Dashboard" description="Plan, track, and ace your term." />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <CalendarDays className="mr-2 h-4 w-4" /> Calendar
            </Button>
            <Button size="sm">New Task</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Subjects"
            value={mockSubjects.length}
            icon={<BookOpen className="text-muted-foreground h-4 w-4" />}
          />
          <StatCard
            title="Assessments Due"
            value={upcoming.length}
            icon={<ClipboardList className="text-muted-foreground h-4 w-4" />}
          />
          <StatCard
            title="Tasks Completed"
            value={`${completedTasks}/${totalTasks}`}
            icon={<CheckCircle2 className="text-muted-foreground h-4 w-4" />}
          />
          <StatCard
            title="Average Grade"
            value={avgGrade !== null ? `${avgGrade}%` : '—'}
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
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {upcoming.map((a) => {
                    const subject = subjectMap[a.subjectId]
                    return (
                      <div key={a._id} className="hover:bg-accent/40 rounded-md border p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl" aria-hidden>
                                {a.icon}
                              </span>
                              <h3 className="leading-none font-medium">{a.name}</h3>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {subject?.code} • {subject?.name} • {a.contribution === 'group' ? 'Group' : 'Individual'}
                            </p>
                          </div>
                          <div className="space-y-2 text-right">
                            <Badge variant="secondary">{a.weight}%</Badge>
                            <div className="text-muted-foreground text-xs">{formatDue(a.dueDate)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                    {tasksByStatus[status].length === 0 ? (
                      <div className="text-muted-foreground text-sm">No tasks here.</div>
                    ) : (
                      tasksByStatus[status].map((t) => {
                        const a = mockAssessments.find((x) => x._id === t.assessmentId)
                        const s = a ? subjectMap[a.subjectId] : undefined
                        return (
                          <div key={t._id} className="flex items-center justify-between rounded-md border p-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <PriorityBadge priority={t.priority as any} />
                                <span className="truncate font-medium">{t.name}</span>
                              </div>
                              <p className="text-muted-foreground mt-1 truncate text-xs">
                                {a?.name} {s ? `• ${s.code}` : ''}
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
              {avgGrade !== null && (
                <div className="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>Average</span>
                  </div>
                  <span className="font-semibold">{avgGrade}%</span>
                </div>
              )}
              <div className="space-y-3">
                {mockGrades.map((g) => {
                  const a = mockAssessments.find((x) => x._id === g.assessmentId)
                  const s = a ? subjectMap[a.subjectId] : undefined
                  return (
                    <div key={g._id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{g.name}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {s?.code} • {s?.name}
                          </div>
                        </div>
                        <Badge variant="secondary">{g.grade}%</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSubjects.map((s) => {
                  const subjectAssessments = mockAssessments.filter((a) => a.subjectId === s._id)
                  const completed = subjectAssessments.filter((a) => a.complete).length
                  const progress = subjectAssessments.length
                    ? Math.round((completed / subjectAssessments.length) * 100)
                    : 0
                  const initials = (s.code ?? s.name)
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  return (
                    <div key={s._id} className="rounded-md border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {s.code} • {s.name}
                            </div>
                            <div className="text-muted-foreground truncate text-xs">
                              Coordinator: {s.coordinatorName ?? '—'}
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
                          <ClipboardList className="h-3.5 w-3.5" /> {subjectAssessments.length} assessments
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {completed} completed
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> Term {s.term}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarPage>
  )
}

export default DashboardPage
