'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/cn'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { type LucideIcon } from 'lucide-react'
import React from 'react'
import { Doc } from '../../../../../convex/_generated/dataModel'
import TaskCard from './task-card'

type KanbanColumnProps = {
  status: 'todo' | 'doing' | 'done'
  tasks: Doc<'tasks'>[]
  subjects: Doc<'subjects'>[]
  label: string
  icon: LucideIcon
  color: string
}

const KanbanColumn = ({ status, tasks, subjects, label, icon, color }: KanbanColumnProps) => {
  const taskIds = tasks.map((task) => task._id)
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  })

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Column Header */}
      <div className="bg-muted/50 border-b p-4">
        <div className="flex items-center gap-2">
          {React.createElement(icon, { className: cn('size-5', color) })}
          <h3 className={cn('font-semibold', color)}>{label}</h3>
          <Badge variant="secondary" className="ml-auto">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Column Body */}
      <ScrollArea className="flex-1">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className={cn('min-h-32 space-y-2 p-4 transition-colors', isOver && 'bg-muted/50')}>
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const subject = task.subjectId ? subjects.find((s) => s._id === task.subjectId) : undefined
                return <TaskCard key={task._id} task={task} subject={subject} />
              })
            ) : (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-muted-foreground text-sm">No tasks</p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </Card>
  )
}

export default KanbanColumn
