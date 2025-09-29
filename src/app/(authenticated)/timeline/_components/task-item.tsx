'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { taskPriorityMap, taskStatusMap, taskTypeMap } from '@/lib/utils/task-utils'
import { BookIcon, CalendarIcon, CheckSquareIcon, SquareIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Doc } from '../../../../../convex/_generated/dataModel'

type TaskItemProps = {
  task: Doc<'tasks'>
  subject?: { name: string; code?: string } | null
  selected?: boolean
  onToggle?: (selected: boolean) => void
  onClick?: (task: Doc<'tasks'>) => void
}

const TaskItem = ({ task, subject, selected = false, onToggle, onClick }: TaskItemProps) => {
  const [hover, setHover] = useState(false)

  // Format due date to show day and month
  const formatDueDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div
      className={cn(
        'group bg-card hover:bg-accent/50 relative cursor-pointer rounded-md border p-3 text-sm shadow-xs transition-[background,border,box-shadow]',
        selected && 'ring-primary ring-2',
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClick?.(task)}
    >
      <button
        className={cn(
          'absolute top-2 left-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100',
          (hover || selected) && 'opacity-100',
        )}
        onClick={() => onToggle?.(!selected)}
        aria-label={selected ? 'Deselect' : 'Select'}
      >
        {selected ? <CheckSquareIcon className="size-4" /> : <SquareIcon className="size-4" />}
      </button>

      <div className="pl-6">
        {/* Horizontal inline layout */}
        <div className="flex items-center gap-3 text-sm">
          {/* Task/Assessment Icon */}
          <div className="shrink-0">{React.createElement(taskTypeMap[task.type].icon, { className: 'size-4' })}</div>

          {/* Task Name */}
          <span className="min-w-0 flex-1 truncate font-medium">{task.name}</span>

          {/* Subject Name - Hidden on mobile */}
          {subject && (
            <Badge variant="outline" className="hidden max-w-64 lg:flex">
              <BookIcon className="size-3 shrink-0" />
              <span className="truncate">{subject.name}</span>
            </Badge>
          )}

          {/* Priority */}
          {task.priority !== 'none' && (
            <Badge
              variant={
                task.priority === 'high'
                  ? 'destructive'
                  : task.priority === 'medium'
                    ? 'warning'
                    : task.priority === 'low'
                      ? 'secondary'
                      : 'outline'
              }
              className="capitalize"
            >
              {React.createElement(taskPriorityMap[task.priority].icon, { className: 'size-3' })}
              <span className="hidden md:inline">{task.priority}</span>
            </Badge>
          )}

          {/* Status */}
          <Badge
            variant={task.status === 'done' ? 'success' : task.status === 'doing' ? 'default' : 'outline'}
            className="capitalize"
          >
            {React.createElement(taskStatusMap[task.status].icon, { className: 'size-3' })}
            <span className="hidden md:inline">{task.status === 'todo' ? 'To Do' : task.status}</span>
          </Badge>

          {/* Due Date */}
          {task.dueDate && (
            <Badge variant="outline">
              <CalendarIcon className="size-3" />
              <span className="hidden md:inline">{formatDueDate(task.dueDate)}</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskItem
