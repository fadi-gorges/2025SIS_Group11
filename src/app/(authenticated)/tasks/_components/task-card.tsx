'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { taskPriorityMap } from '@/lib/utils/task-utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { BookIcon, CalendarIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Doc } from '../../../../../convex/_generated/dataModel'
import TaskDialog from '../../timeline/_components/task-dialog'

type TaskCardProps = {
  task: Doc<'tasks'>
  subject?: Doc<'subjects'>
}

const TaskCard = ({ task, subject }: TaskCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig = taskPriorityMap[task.priority]

  const handleClick = () => {
    // Only open dialog if we're not in the middle of dragging
    // The activation constraint in the board will prevent this from firing during drags
    if (!isDragging) {
      setDialogOpen(true)
    }
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-card hover:border-primary/50 cursor-grab border p-3 transition-all hover:shadow-sm active:cursor-grabbing',
          isDragging && 'opacity-50',
        )}
        onClick={handleClick}
        {...attributes}
        {...listeners}
      >
        <div className="space-y-2">
          {/* Task Name */}
          <h4 className="truncate text-sm font-medium">{task.name}</h4>

          {/* Task Details */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Badge */}
            {task.priority !== 'none' && (
              <Badge variant="outline" className={cn('gap-1 text-xs', priorityConfig.color)}>
                {React.createElement(priorityConfig.icon, { className: 'size-3' })}
                {priorityConfig.label}
              </Badge>
            )}

            {/* Subject Badge */}
            {subject && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <BookIcon className="size-3" />
                <span className="truncate">{subject.name}</span>
              </Badge>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                <CalendarIcon className="size-3" />
                {format(task.dueDate, 'MMM d')}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <TaskDialog taskId={task._id} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export default TaskCard
