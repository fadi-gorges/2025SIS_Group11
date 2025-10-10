'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { InboxIcon, ListTodoIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Doc } from '../../../../../convex/_generated/dataModel'
import TaskDialog from '../../tasks/_components/task-dialog'
import TaskFormSheet from '../../tasks/_components/task-form-sheet'
import TaskItem from './task-item'

type UnassignedTasksColumnProps = {
  tasks: Doc<'tasks'>[]
  subjects: Doc<'subjects'>[]
}

const UnassignedTasksColumn = ({ tasks, subjects }: UnassignedTasksColumnProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  const totalTasks = tasks?.length
  const todoTasks = tasks?.filter((task) => task.status === 'todo').length
  const doingTasks = tasks?.filter((task) => task.status === 'doing').length
  const doneTasks = tasks?.filter((task) => task.status === 'done').length

  const handleTaskClick = (task: Doc<'tasks'>) => {
    setSelectedTaskId(task._id)
    setIsTaskDialogOpen(true)
  }

  return (
    <div className="w-full">
      <Card className="border-muted-foreground/30 border-2 border-dashed">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">Unassigned Tasks</h3>
              <p className="text-muted-foreground text-xs">Assign these tasks to a week to plan your timeline</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0">
                <InboxIcon className="size-3" />
                {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
              </Badge>
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
            tasks.map((t) => (
              <TaskItem
                key={t._id}
                task={t}
                subject={subjects.find((s) => s._id === t.subjectId)}
                onClick={handleTaskClick}
              />
            ))
          ) : (
            <div className="text-muted-foreground grid place-items-center rounded-md border border-dashed py-8 text-sm">
              <ListTodoIcon className="mb-2 size-5" />
              All tasks are assigned to weeks
            </div>
          )}

          {/* Task Creation Component */}
          <div className="mt-2">
            <TaskFormSheet>
              <Button variant="outline" className="text-muted-foreground hover:text-foreground w-full justify-start">
                <PlusIcon className="mr-2 size-4" />
                Create Task
              </Button>
            </TaskFormSheet>
          </div>
        </CardContent>
      </Card>

      <TaskDialog taskId={selectedTaskId} open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen} />
    </div>
  )
}

export default UnassignedTasksColumn
