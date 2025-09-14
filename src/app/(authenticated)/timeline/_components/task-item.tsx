'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { CalendarIcon, CheckSquareIcon, SquareIcon } from 'lucide-react'
import { useState } from 'react'
import { Doc } from '../../../../../convex/_generated/dataModel'

type TaskItemProps = {
  task: Doc<'tasks'>
  selected?: boolean
  onToggle?: (selected: boolean) => void
}

const TaskItem = ({ task, selected = false, onToggle }: TaskItemProps) => {
  const [hover, setHover] = useState(false)

  return (
    <div
      className={cn(
        'group bg-card hover:bg-accent/50 relative rounded-md border p-3 text-sm shadow-xs transition-[background,border,box-shadow]',
        selected && 'ring-primary ring-2',
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
        <div className="flex items-center justify-between gap-3">
          <h4 className="truncate font-medium">{task.name}</h4>
          <Badge variant="secondary" className="shrink-0">
            {task.type}
          </Badge>
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="size-3.5" /> {new Date(task.dueDate).toLocaleDateString('en-AU')}
            </span>
          )}
          <span className="capitalize">{task.status}</span>
          <span>•</span>
          <span className="capitalize">{task.priority} priority</span>
        </div>
      </div>
    </div>
  )
}

export default TaskItem
