'use client'

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/extensions/credenza'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils/cn'
import { taskPriorityMap, taskStatusMap, taskTypeMap } from '@/lib/utils/task-utils'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from 'convex/react'
import { format } from 'date-fns'
import {
  BookIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  EditIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { VALIDATION_LIMITS, taskNameSchema } from '../../../../../convex/validation'
import TaskFormSheet from '../../tasks/_components/task-form-sheet'

// Form schemas
const addSubtaskSchema = z.object({
  name: taskNameSchema,
})

const editSubtaskSchema = z.object({
  name: taskNameSchema,
})

type AddSubtaskData = z.infer<typeof addSubtaskSchema>
type EditSubtaskData = z.infer<typeof editSubtaskSchema>

type TaskDialogProps = {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SubtaskItemProps = {
  subtask: { name: string; done: boolean }
  index: number
  onToggle: (index: number, done: boolean) => void
  onDelete: (index: number) => void
  onEdit: (index: number, name: string) => void
}

const SubtaskItem = ({ subtask, index, onToggle, onDelete, onEdit }: SubtaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `subtask-${index}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const editForm = useForm<EditSubtaskData>({
    resolver: zodResolver(editSubtaskSchema as any),
    defaultValues: {
      name: subtask.name,
    },
  })

  const handleEditSubmit = async (data: EditSubtaskData) => {
    try {
      onEdit(index, data.name.trim())
      setIsEditing(false)
    } catch {
      toast.error('Failed to update subtask')
    }
  }

  const handleEditCancel = () => {
    editForm.reset({ name: subtask.name })
    setIsEditing(false)
  }

  // Reset form when switching to edit mode
  React.useEffect(() => {
    if (isEditing) {
      editForm.reset({ name: subtask.name })
    }
  }, [isEditing, subtask.name, editForm])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-md border p-2 transition-colors',
        isDragging && 'opacity-50',
        subtask.done && 'opacity-60',
      )}
    >
      <div {...attributes} {...listeners} className="cursor-move opacity-50 group-hover:opacity-100">
        <GripVerticalIcon className="size-4" />
      </div>

      <Checkbox checked={subtask.done} onCheckedChange={(checked) => onToggle(index, !!checked)} />

      {isEditing ? (
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="flex flex-1 items-center gap-2">
            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={VALIDATION_LIMITS.TASK_NAME_MAX_LENGTH}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEditCancel()
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="sm" variant="ghost">
              <CheckIcon className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleEditCancel}>
              <XIcon className="size-4" />
            </Button>
          </form>
        </Form>
      ) : (
        <span
          className={cn('flex-1 cursor-pointer truncate', subtask.done && 'text-muted-foreground line-through')}
          onClick={() => setIsEditing(true)}
          title={subtask.name}
        >
          {subtask.name}
        </span>
      )}

      <Button size="sm" variant="ghost" onClick={() => onDelete(index)} className="opacity-0 group-hover:opacity-100">
        <TrashIcon className="text-destructive size-4" />
      </Button>
    </div>
  )
}

const TaskDialog = ({ taskId, open, onOpenChange }: TaskDialogProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [subtasks, setSubtasks] = useState<{ name: string; done: boolean }[]>([])

  // Fetch task data dynamically
  const task = useQuery(api.tasks.getTaskById, taskId ? { taskId: taskId as Id<'tasks'> } : 'skip')
  const subjects = useQuery(api.subjects.getSubjectsByUser, {})

  const updateTaskSubtasks = useMutation(api.tasks.updateTaskSubtasks)
  const deleteTask = useMutation(api.tasks.deleteTask)

  // Form for adding new subtasks
  const addSubtaskForm = useForm<AddSubtaskData>({
    resolver: zodResolver(addSubtaskSchema as any),
    defaultValues: {
      name: '',
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Initialize subtasks when task changes
  React.useEffect(() => {
    if (task) {
      setSubtasks(task.subtasks || [])
    }
  }, [task])

  // Get the subject for this task
  const subject = task && subjects ? subjects.find((s) => s._id === task.subjectId) : null

  if (!task) return null

  const handleSubtaskReorder = (event: DragEndEvent) => {
    if (!task) return

    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split('-')[1])
      const newIndex = parseInt(over.id.toString().split('-')[1])

      const newSubtasks = arrayMove(subtasks, oldIndex, newIndex)
      setSubtasks(newSubtasks)
      updateTaskSubtasks({ taskId: task._id, subtasks: newSubtasks })
    }
  }

  const handleSubtaskToggle = async (index: number, done: boolean) => {
    if (!task) return

    const newSubtasks = [...subtasks]
    newSubtasks[index] = { ...newSubtasks[index], done }
    setSubtasks(newSubtasks)
    await updateTaskSubtasks({ taskId: task._id, subtasks: newSubtasks })
  }

  const handleSubtaskDelete = async (index: number) => {
    if (!task) return

    const newSubtasks = subtasks.filter((_, i) => i !== index)
    setSubtasks(newSubtasks)
    await updateTaskSubtasks({ taskId: task._id, subtasks: newSubtasks })
  }

  const handleSubtaskEdit = async (index: number, name: string) => {
    if (!task) return

    const newSubtasks = [...subtasks]
    newSubtasks[index] = { ...newSubtasks[index], name }
    setSubtasks(newSubtasks)
    await updateTaskSubtasks({ taskId: task._id, subtasks: newSubtasks })
  }

  const handleAddSubtask = async (data: AddSubtaskData) => {
    if (!task) return

    try {
      const newSubtasks = [...subtasks, { name: data.name.trim(), done: false }]
      setSubtasks(newSubtasks)
      await updateTaskSubtasks({ taskId: task._id, subtasks: newSubtasks })
      addSubtaskForm.reset({ name: '' })
      toast.success('Subtask added successfully')
    } catch {
      toast.error('Failed to add subtask')
    }
  }

  const handleDeleteTask = async () => {
    if (!task) return

    try {
      await deleteTask({ taskId: task._id })
      toast.success('Task deleted successfully')
      setIsDeleteDialogOpen(false)
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.data || 'Failed to delete task')
    }
  }

  const completedSubtasks = subtasks.filter((s) => s.done).length
  const totalSubtasks = subtasks.length

  return (
    <>
      <Credenza open={open} onOpenChange={onOpenChange}>
        <CredenzaContent className="max-w-2xl">
          <CredenzaHeader>
            <CredenzaTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {React.createElement(taskTypeMap[task.type].icon, { className: 'size-5' })}
                <span className="truncate" title={task.name}>
                  {task.name}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      // Trigger the hidden button to open the sheet
                      document.getElementById(`edit-task-${task._id}`)?.click()
                    }}
                  >
                    <EditIcon className="size-4" />
                    Edit task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="text-destructive size-4" />
                    Delete task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CredenzaTitle>
          </CredenzaHeader>

          <CredenzaBody className="space-y-6">
            {/* Task Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">Status</h4>
                  <Badge
                    variant={task.status === 'done' ? 'success' : task.status === 'doing' ? 'default' : 'outline'}
                    className="mt-1"
                  >
                    {React.createElement(taskStatusMap[task.status].icon, { className: 'size-3' })}
                    {taskStatusMap[task.status].label}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">Priority</h4>
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
                    className="mt-1"
                  >
                    {React.createElement(taskPriorityMap[task.priority].icon, { className: 'size-3' })}
                    {taskPriorityMap[task.priority].label}
                  </Badge>
                </div>

                {subject && (
                  <div>
                    <h4 className="text-muted-foreground text-sm font-medium">Subject</h4>
                    <Badge variant="outline" className="mt-1 max-w-full">
                      <BookIcon className="size-3 shrink-0" />
                      <span className="truncate" title={subject.name}>
                        {subject.name}
                      </span>
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {task.dueDate && (
                  <div>
                    <h4 className="text-muted-foreground text-sm font-medium">Due Date</h4>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <CalendarIcon className="size-4" />
                      {format(new Date(task.dueDate), 'PPP p')}
                    </div>
                  </div>
                )}

                {task.reminderTime && (
                  <div>
                    <h4 className="text-muted-foreground text-sm font-medium">Reminder</h4>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <ClockIcon className="size-4" />
                      {format(new Date(task.reminderTime), 'PPP p')}
                    </div>
                  </div>
                )}

                {totalSubtasks > 0 && (
                  <div>
                    <h4 className="text-muted-foreground text-sm font-medium">Progress</h4>
                    <div className="mt-1 text-sm">
                      {completedSubtasks} of {totalSubtasks} subtasks completed
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-muted-foreground text-sm font-medium">Description</h4>
                <p className="text-foreground mt-2 line-clamp-6 text-sm whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            <Separator />

            {/* Subtasks */}
            <div>
              <h4 className="mb-4 text-sm font-medium">
                Subtasks {totalSubtasks > 0 && `(${completedSubtasks}/${totalSubtasks})`}
              </h4>

              {/* Add new subtask */}
              <Form {...addSubtaskForm}>
                <form onSubmit={addSubtaskForm.handleSubmit(handleAddSubtask)} className="mb-4 flex gap-2">
                  <FormField
                    control={addSubtaskForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Add a subtask..."
                            maxLength={VALIDATION_LIMITS.TASK_NAME_MAX_LENGTH}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={!addSubtaskForm.watch('name')?.trim()}>
                    <PlusIcon className="size-4" />
                  </Button>
                </form>
              </Form>

              {/* Subtasks list */}
              {subtasks.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubtaskReorder}>
                  <SortableContext
                    items={subtasks.map((_, i) => `subtask-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {subtasks.map((subtask, index) => (
                        <SubtaskItem
                          key={`subtask-${index}`}
                          subtask={subtask}
                          index={index}
                          onToggle={handleSubtaskToggle}
                          onDelete={handleSubtaskDelete}
                          onEdit={handleSubtaskEdit}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
                  No subtasks yet. Add one above to get started.
                </div>
              )}
            </div>
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>

      {/* Edit Task Sheet - Render hidden trigger and click it when needed */}
      <TaskFormSheet taskToEdit={task}>
        <Button
          id={`edit-task-${task._id}`}
          style={{ display: 'none' }}
          onClick={() => {
            // Hidden trigger button for TaskFormSheet
          }}
        />
      </TaskFormSheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all its subtasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default TaskDialog
