'use client'

import TaskFormSheet from '@/app/(authenticated)/tasks/_components/task-form-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { taskStatusMap } from '@/lib/utils/task-utils'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMutation, usePreloadedQuery, useQuery, type Preloaded } from 'convex/react'
import { PlusIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { Doc, Id } from '../../../../../convex/_generated/dataModel'
import KanbanColumn from './kanban-column'
import TaskCard from './task-card'
import TaskDialog from './task-dialog'

type KanbanBoardProps = {
  preloadedCurrentWeekData: Preloaded<typeof api.tasks.getTasksForCurrentWeekKanban>
}

const KanbanBoard = ({ preloadedCurrentWeekData }: KanbanBoardProps) => {
  const currentWeekData = usePreloadedQuery(preloadedCurrentWeekData)
  const subjects = useQuery(api.subjects.getSubjectsByUser, {})
  const updateTaskOrderAndStatus = useMutation(api.tasks.updateTaskOrderAndStatus)
  const reorderTasks = useMutation(api.tasks.reorderTasks)
  const searchParams = useSearchParams()

  const [localTasks, setLocalTasks] = useState<Doc<'tasks'>[]>(currentWeekData?.tasks || [])
  const [activeTask, setActiveTask] = useState<Doc<'tasks'> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTaskId, setDialogTaskId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Update local tasks when data changes
  if (currentWeekData && localTasks !== currentWeekData.tasks) {
    setLocalTasks(currentWeekData.tasks)
  }

  // Handle URL parameter to open task dialog
  useEffect(() => {
    const taskId = searchParams.get('task')
    if (taskId) {
      setDialogTaskId(taskId)
      setDialogOpen(true)
    }
  }, [searchParams])

  if (!currentWeekData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <Badge variant="secondary">No Current Week</Badge>
        <p className="text-muted-foreground text-sm">
          No current week is set. Please go to the Timeline page to set the current week.
        </p>
      </div>
    )
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = localTasks.find((task) => task._id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragCancel = () => {
    setActiveTask(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) {
      return
    }

    const draggedTask = localTasks.find((task) => task._id === active.id)
    if (!draggedTask) return

    // Determine the target status based on the over element
    let targetStatus = draggedTask.status
    const overTask = localTasks.find((task) => task._id === over.id)

    if (overTask) {
      // Dropped on another task
      targetStatus = overTask.status
    } else if (typeof over.id === 'string' && over.id.startsWith('column-')) {
      // Dropped on a column
      targetStatus = over.id.replace('column-', '') as 'todo' | 'doing' | 'done'
    }

    // Get tasks in the target status
    const targetStatusTasks = localTasks.filter((task) => task.status === targetStatus)
    const activeIndex = targetStatusTasks.findIndex((task) => task._id === active.id)
    const overIndex = targetStatusTasks.findIndex((task) => task._id === over.id)

    // If moving within the same status and dropped on another task
    if (draggedTask.status === targetStatus && activeIndex !== -1 && overIndex !== -1) {
      const reorderedTasks = arrayMove(targetStatusTasks, activeIndex, overIndex)

      // Update local state optimistically
      const newTasks = [...localTasks]
      const otherTasks = newTasks.filter((task) => task.status !== targetStatus)
      const updatedLocalTasks = [...otherTasks, ...reorderedTasks].sort((a, b) => a.order - b.order)
      setLocalTasks(updatedLocalTasks)

      try {
        // Update order in the backend
        const taskIds = reorderedTasks.map((task) => task._id as Id<'tasks'>)
        const startOrder = Math.min(...reorderedTasks.map((task) => task.order))
        await reorderTasks({ taskIds, startOrder })
      } catch {
        toast.error('Failed to reorder tasks')
        setLocalTasks(currentWeekData.tasks)
      }
    } else if (draggedTask.status !== targetStatus) {
      // Moving to a different status
      const updatedTask = { ...draggedTask, status: targetStatus }
      const newOrder = overTask
        ? overTask.order
        : targetStatusTasks.length > 0
          ? Math.max(...targetStatusTasks.map((t) => t.order)) + 1
          : 0

      // Update local state optimistically
      const newTasks = localTasks.map((task) =>
        task._id === draggedTask._id ? { ...updatedTask, order: newOrder } : task,
      )
      setLocalTasks(newTasks)

      try {
        await updateTaskOrderAndStatus({
          taskId: draggedTask._id,
          newStatus: targetStatus,
          newOrder,
        })
      } catch {
        toast.error('Failed to update task')
        setLocalTasks(currentWeekData.tasks)
      }
    }
  }

  const todoTasks = localTasks.filter((task) => task.status === 'todo').sort((a, b) => a.order - b.order)
  const doingTasks = localTasks.filter((task) => task.status === 'doing').sort((a, b) => a.order - b.order)
  const doneTasks = localTasks.filter((task) => task.status === 'done').sort((a, b) => a.order - b.order)

  return (
    <div className="flex h-full flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground text-sm">{currentWeekData.currentWeek.name}</p>
        </div>
        <TaskFormSheet weekId={currentWeekData.currentWeek._id}>
          <Button size="sm">
            <PlusIcon className="size-4" />
            New Task
          </Button>
        </TaskFormSheet>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          <KanbanColumn
            status="todo"
            tasks={todoTasks}
            subjects={subjects || []}
            label={taskStatusMap.todo.label}
            icon={taskStatusMap.todo.icon}
            color={taskStatusMap.todo.color}
          />
          <KanbanColumn
            status="doing"
            tasks={doingTasks}
            subjects={subjects || []}
            label={taskStatusMap.doing.label}
            icon={taskStatusMap.doing.icon}
            color={taskStatusMap.doing.color}
          />
          <KanbanColumn
            status="done"
            tasks={doneTasks}
            subjects={subjects || []}
            label={taskStatusMap.done.label}
            icon={taskStatusMap.done.icon}
            color={taskStatusMap.done.color}
          />
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} subject={subjects?.find((s) => s._id === activeTask.subjectId)} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Dialog */}
      <TaskDialog 
        taskId={dialogTaskId} 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setDialogTaskId(null)
            // Remove the task parameter from URL when dialog closes
            const url = new URL(window.location.href)
            url.searchParams.delete('task')
            window.history.replaceState({}, '', url.toString())
          }
        }} 
      />
    </div>
  )
}

export default KanbanBoard
