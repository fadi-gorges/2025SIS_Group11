'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { useMutation } from 'convex/react'
import { format } from 'date-fns'
import { EditIcon, KanbanSquareIcon, MoreVerticalIcon, PlayCircleIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { Doc } from '../../../../../convex/_generated/dataModel'
import TaskItem from './task-item'
import WeekFormSheet from './week-form-sheet'

type WeekColumnProps = {
  week: Doc<'weeks'>
  tasks: Doc<'tasks'>[]
}

const WeekColumn = ({ week, tasks }: WeekColumnProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const startWeek = useMutation(api.weeks.startWeek)
  const deleteWeek = useMutation(api.weeks.deleteWeek)

  const totalTasks = tasks?.length
  const todoTasks = tasks?.filter((task) => task.status === 'todo').length
  const doingTasks = tasks?.filter((task) => task.status === 'doing').length
  const doneTasks = tasks?.filter((task) => task.status === 'done').length

  const onStartWeek = async () => {
    const { tasksMovedCount } = await startWeek({ weekId: week._id })
    if (tasksMovedCount > 0) {
      toast.success(`${tasksMovedCount} tasks moved to ${week.name}`)
    }
  }

  const onDeleteWeek = async () => {
    await deleteWeek({ weekId: week._id })
    setIsDeleteDialogOpen(false)
  }

  return (
    <div className="w-full">
      <Card
        className={cn(
          'border-2',
          week.current ? (week.isHoliday ? 'border-amber-600/60' : 'border-primary/60') : 'border-transparent',
        )}
      >
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className={cn('text-sm font-medium tracking-wide uppercase', week.isHoliday && 'text-amber-600')}>
                {week.isHoliday ? 'Holiday' : 'Week'}
              </div>
              <h3 className="truncate text-lg font-semibold">{week.name}</h3>
              <p className="text-muted-foreground text-xs">
                {format(new Date(week.startDate), 'EEE dd MMM')} – {format(new Date(week.endDate), 'EEE dd MMM')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {week.current ? (
                <Badge variant="secondary">Current Week</Badge>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="shrink-0">
                      <PlayCircleIcon className="size-4" /> Start Week
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Start {week.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Incomplete tasks from the previous week will be moved here.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onStartWeek}>Start</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <EditIcon className="size-4" />
                    Edit week
                  </DropdownMenuItem>
                  {!week.current && (
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <TrashIcon className="text-destructive size-4" />
                      Delete week
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardTitle>
          {tasks ? (
            <div className="text-muted-foreground flex gap-2 text-xs">
              <span>{totalTasks} tasks</span>
              <span>•</span>
              <span>{todoTasks} todo</span>
              <span>•</span>
              <span>{doingTasks} in progress</span>
              <span>•</span>
              <span>{doneTasks} done</span>
            </div>
          ) : (
            <Skeleton className="h-4 w-48" />
          )}
        </CardHeader>
        <Separator />
        <CardContent className="space-y-2 py-3">
          {tasks && tasks.length > 0 ? (
            tasks.map((t) => <TaskItem key={t._id} task={t} />)
          ) : (
            <div className="text-muted-foreground grid place-items-center rounded-md border border-dashed py-8 text-sm">
              <KanbanSquareIcon className="mb-2 size-5" />
              No tasks yet
            </div>
          )}
        </CardContent>
      </Card>

      <WeekFormSheet open={isEditOpen} onOpenChange={setIsEditOpen} isHoliday={week.isHoliday} weekToEdit={week} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {week.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All tasks assigned to this week will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteWeek}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default WeekColumn
