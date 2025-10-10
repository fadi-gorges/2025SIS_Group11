'use client'

import UnassignedTasksColumn from '@/app/(authenticated)/timeline/_components/unassigned-tasks-column'
import WeekColumn from '@/app/(authenticated)/timeline/_components/week-column'
import WeekFormDialog from '@/app/(authenticated)/timeline/_components/week-form-dialog'
import SearchInput from '@/components/extensions/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { arrayMove } from '@dnd-kit/sortable'
import { useMutation, usePreloadedQuery, type Preloaded } from 'convex/react'
import { CalendarPlusIcon, CalendarRangeIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { Doc, Id } from '../../../../../convex/_generated/dataModel'
import TaskItem from './task-item'

type TimelineBoardProps = {
  preloadedWeeks: Preloaded<typeof api.weeks.getWeeksByUser>
  preloadedTasks: Preloaded<typeof api.tasks.getTasksForTimeline>
  preloadedSubjects: Preloaded<typeof api.subjects.getSubjectsByUser>
}

const TimelineBoard = ({ preloadedWeeks, preloadedTasks, preloadedSubjects }: TimelineBoardProps) => {
  const weeks = usePreloadedQuery(preloadedWeeks)
  const tasksData = usePreloadedQuery(preloadedTasks)
  const subjects = usePreloadedQuery(preloadedSubjects)
  const [openWeekForm, setOpenWeekForm] = useState<{
    mode: 'create'
    isHoliday: boolean
  } | null>(null)

  const updateTaskWeekAndOrder = useMutation(api.tasks.updateTaskWeekAndOrder)
  const reorderTasks = useMutation(api.tasks.reorderTasks)

  const [localTasks, setLocalTasks] = useState<Doc<'tasks'>[]>(tasksData)
  const [activeTask, setActiveTask] = useState<Doc<'tasks'> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  )

  // Update local tasks when data changes
  if (tasksData !== localTasks) {
    setLocalTasks(tasksData)
  }

  // Filter unassigned tasks (tasks without a weekId)
  const unassignedTasks = localTasks.filter((task) => !task.weekId)

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

    // Determine the target week based on the over element
    let targetWeekId: Id<'weeks'> | null | undefined = draggedTask.weekId
    const overTask = localTasks.find((task) => task._id === over.id)

    if (overTask) {
      // Dropped on another task - use that task's weekId
      targetWeekId = overTask.weekId
    } else if (typeof over.id === 'string') {
      // Dropped on a week column or unassigned column
      if (over.id === 'unassigned-column') {
        targetWeekId = undefined
      } else if (over.id.startsWith('week-')) {
        targetWeekId = over.id.replace('week-', '') as Id<'weeks'>
      }
    }

    // Get tasks in the target week/unassigned (normalize undefined to null for comparison)
    const normalizeWeekId = (weekId: Id<'weeks'> | null | undefined) => weekId ?? null
    const targetWeekTasks = localTasks.filter((task) => normalizeWeekId(task.weekId) === normalizeWeekId(targetWeekId))
    const activeIndex = targetWeekTasks.findIndex((task) => task._id === active.id)
    const overIndex = targetWeekTasks.findIndex((task) => task._id === over.id)

    // If moving within the same week and dropped on another task
    if (
      normalizeWeekId(draggedTask.weekId) === normalizeWeekId(targetWeekId) &&
      activeIndex !== -1 &&
      overIndex !== -1
    ) {
      const reorderedTasks = arrayMove(targetWeekTasks, activeIndex, overIndex)

      // Update local state optimistically
      const newTasks = [...localTasks]
      const otherTasks = newTasks.filter((task) => normalizeWeekId(task.weekId) !== normalizeWeekId(targetWeekId))
      const updatedLocalTasks = [...otherTasks, ...reorderedTasks].sort((a, b) => a.order - b.order)
      setLocalTasks(updatedLocalTasks)

      try {
        // Update order in the backend
        const taskIds = reorderedTasks.map((task) => task._id as Id<'tasks'>)
        const startOrder = Math.min(...reorderedTasks.map((task) => task.order))
        await reorderTasks({ taskIds, startOrder })
      } catch {
        toast.error('Failed to reorder tasks')
        setLocalTasks(tasksData)
      }
    } else if (normalizeWeekId(draggedTask.weekId) !== normalizeWeekId(targetWeekId)) {
      // Moving to a different week
      const newOrder = overTask
        ? overTask.order
        : targetWeekTasks.length > 0
          ? Math.max(...targetWeekTasks.map((t) => t.order)) + 1
          : 0

      // Convert null to undefined for Doc type compatibility
      const weekIdForDoc = targetWeekId === null ? undefined : targetWeekId

      // Update local state optimistically
      const newTasks = localTasks.map((task) =>
        task._id === draggedTask._id ? { ...task, weekId: weekIdForDoc, order: newOrder } : task,
      )
      setLocalTasks(newTasks)

      try {
        await updateTaskWeekAndOrder({
          taskId: draggedTask._id,
          weekId: targetWeekId,
          newOrder,
        })
      } catch {
        toast.error('Failed to update task')
        setLocalTasks(tasksData)
      }
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <SearchInput searchName="tasks" />
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpenWeekForm({ mode: 'create', isHoliday: true })}>
            <CalendarRangeIcon className="size-4" /> Add holiday
          </Button>
          <Button size="sm" onClick={() => setOpenWeekForm({ mode: 'create', isHoliday: false })}>
            <CalendarPlusIcon className="size-4" /> Add week
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="relative flex flex-1 flex-col gap-3 pb-2">
          {weeks.length === 0 ? (
            <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-3 text-center">
              <Badge variant="secondary">No weeks yet</Badge>
              <p className="text-muted-foreground text-sm">Create your first week to start planning.</p>
              <Button size="sm" onClick={() => setOpenWeekForm({ mode: 'create', isHoliday: false })}>
                <CalendarPlusIcon className="size-4" /> Create Week 1
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-3">
              {weeks.map((week) => (
                <WeekColumn
                  key={week._id}
                  week={week}
                  tasks={localTasks.filter((task) => task.weekId === week._id)}
                  subjects={subjects}
                />
              ))}

              {/* Unassigned Tasks Section - Always Visible */}
              <UnassignedTasksColumn tasks={unassignedTasks} subjects={subjects} />
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-3 opacity-90">
              <TaskItem task={activeTask} subject={subjects.find((s) => s._id === activeTask.subjectId)} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {openWeekForm && (
        <WeekFormDialog
          open={!!openWeekForm}
          onOpenChange={() => setOpenWeekForm(null)}
          isHoliday={openWeekForm.isHoliday}
          weeks={weeks}
        />
      )}
    </div>
  )
}

export default TimelineBoard
