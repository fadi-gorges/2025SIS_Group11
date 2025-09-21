'use client'

import DateTimePicker from '@/components/datetime/date-time-picker'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import { taskPriorityMap, taskStatusMap } from '@/lib/utils/task-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from 'convex/react'
import { BookIcon, Check, ChevronsUpDown } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { Doc, Id } from '../../../../../convex/_generated/dataModel'
import { TaskData, taskFormSchema, VALIDATION_LIMITS } from '../../../../../convex/validation'

type TaskFormSheetProps = {
  weekId?: Id<'weeks'>
  taskToEdit?: Doc<'tasks'>
  children: React.ReactNode
}

export const TaskFormSheet = ({ children, weekId, taskToEdit }: TaskFormSheetProps) => {
  const createTask = useMutation(api.tasks.createTask)
  const updateTask = useMutation(api.tasks.updateTask)
  const subjects = useQuery(api.subjects.getSubjectsByUser, {})
  const weeks = useQuery(api.weeks.getWeeksByUser, { includeHolidays: false })

  const [open, setOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [weekOpen, setWeekOpen] = useState(false)

  const isEditing = !!taskToEdit

  const form = useForm<TaskData>({
    resolver: zodResolver(taskFormSchema as any),
    defaultValues: {
      name: '',
      type: 'task',
      description: '',
      weekId: weekId || undefined,
      dueDate: undefined,
      status: 'todo',
      priority: 'none',
      reminderTime: undefined,
      subjectId: undefined,
    },
  })

  // Reset form when task changes or sheet opens
  useEffect(() => {
    if (open) {
      if (taskToEdit) {
        // Editing existing task
        form.reset({
          name: taskToEdit.name,
          description: taskToEdit.description || '',
          weekId: taskToEdit.weekId || undefined,
          dueDate: taskToEdit.dueDate,
          status: taskToEdit.status,
          priority: taskToEdit.priority,
          reminderTime: taskToEdit.reminderTime,
          subjectId: taskToEdit.subjectId || undefined,
        })
      } else {
        // Creating new task
        form.reset({
          name: '',
          description: '',
          weekId: weekId || undefined,
          dueDate: undefined,
          status: 'todo',
          priority: 'none',
          reminderTime: undefined,
          subjectId: undefined,
        })
      }
    }
  }, [open, taskToEdit, weekId, form])

  const onSubmit = async (data: TaskData) => {
    try {
      if (isEditing && taskToEdit) {
        await updateTask({
          taskId: taskToEdit._id,
          name: data.name,
          description: data.description || undefined,
          weekId: data.weekId ? (data.weekId as Id<'weeks'>) : undefined,
          dueDate: data.dueDate,
          status: data.status,
          priority: data.priority,
          reminderTime: data.reminderTime,
          subjectId: data.subjectId ? (data.subjectId as Id<'subjects'>) : undefined,
        })
        toast.success('Task updated successfully')
      } else {
        await createTask({
          name: data.name,
          description: data.description || undefined,
          weekId: data.weekId ? (data.weekId as Id<'weeks'>) : undefined,
          dueDate: data.dueDate,
          status: data.status,
          priority: data.priority,
          reminderTime: data.reminderTime,
          subjectId: data.subjectId ? (data.subjectId as Id<'subjects'>) : undefined,
        })
        toast.success('Task created successfully')
      }

      setOpen(false)
    } catch (e: any) {
      toast.error(e?.data || `Failed to ${isEditing ? 'update' : 'create'} task.`)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Task' : 'New Task'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update your task details.' : 'Create a new task to track your work.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-x-hidden overflow-y-auto p-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.TASK_NAME_MAX_LENGTH}
                      placeholder="e.g., Complete assignment"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      maxLength={VALIDATION_LIMITS.TASK_DESCRIPTION_MAX_LENGTH}
                      placeholder="Optional details..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Status</FormLabel>
                  <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={statusOpen}
                          className="w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {React.createElement(taskStatusMap[field.value].icon, {
                              className: cn('size-4', taskStatusMap[field.value].color),
                            })}
                            <span className={cn(taskStatusMap[field.value].color, 'font-semibold')}>
                              {taskStatusMap[field.value].label}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-sm p-0" align="end">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {Object.entries(taskStatusMap).map(([value, config]) => (
                              <CommandItem
                                value={config.label}
                                key={value}
                                onSelect={() => {
                                  field.onChange(value)
                                  setStatusOpen(false)
                                }}
                              >
                                <Check className={cn('size-4', value === field.value ? 'opacity-100' : 'opacity-0')} />
                                {React.createElement(config.icon, {
                                  className: cn('size-4', config.color),
                                })}
                                <span className={cn(config.color, 'font-semibold')}>{config.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Priority</FormLabel>
                  <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={priorityOpen}
                          className="w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {React.createElement(taskPriorityMap[field.value].icon, {
                              className: cn('size-4', taskPriorityMap[field.value].color),
                            })}
                            <span className={cn(taskPriorityMap[field.value].color, 'font-semibold')}>
                              {taskPriorityMap[field.value].label}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-sm p-0" align="end">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {Object.entries(taskPriorityMap).map(([value, config]) => (
                              <CommandItem
                                value={config.label}
                                key={value}
                                onSelect={() => {
                                  field.onChange(value)
                                  setPriorityOpen(false)
                                }}
                              >
                                <Check className={cn('size-4', value === field.value ? 'opacity-100' : 'opacity-0')} />
                                {React.createElement(config.icon, {
                                  className: cn('size-4', config.color),
                                })}
                                <span className={cn(config.color, 'font-semibold')}>{config.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Week Assignment */}
            <FormField
              control={form.control}
              name="weekId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Week</FormLabel>
                  <Popover open={weekOpen} onOpenChange={setWeekOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={weekOpen}
                          className={cn(
                            'w-full justify-between truncate',
                            field.value === 'unassigned' && 'text-muted-foreground',
                          )}
                        >
                          {field.value === 'unassigned'
                            ? 'Unassigned'
                            : field.value
                              ? weeks?.find((week) => week._id === field.value)?.name
                              : 'Select week...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-sm p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Search weeks..." />
                        <CommandList>
                          <CommandEmpty>No week found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="unassigned"
                              key="unassigned"
                              onSelect={() => {
                                field.onChange('unassigned')
                                setWeekOpen(false)
                              }}
                            >
                              <Check
                                className={cn('size-4', field.value === 'unassigned' ? 'opacity-100' : 'opacity-0')}
                              />
                              <span className="text-muted-foreground">Unassigned</span>
                            </CommandItem>
                            {weeks?.map((week) => (
                              <CommandItem
                                value={week.name}
                                key={week._id}
                                onSelect={() => {
                                  field.onChange(week._id)
                                  setWeekOpen(false)
                                }}
                              >
                                <Check
                                  className={cn('size-4', week._id === field.value ? 'opacity-100' : 'opacity-0')}
                                />
                                <span className="truncate">{week.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject Selection */}
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Subject</FormLabel>
                  <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={subjectOpen}
                          className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                        >
                          <div className="flex items-center gap-2">
                            <BookIcon className="size-4" />
                            <span className="truncate">
                              {field.value
                                ? subjects?.find((subject) => subject._id === field.value)?.name
                                : 'Select subject...'}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-sm p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Search subjects..." />
                        <CommandList>
                          <CommandEmpty>No subject found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              key="none"
                              onSelect={() => {
                                field.onChange(undefined)
                                setSubjectOpen(false)
                              }}
                            >
                              <Check className={cn('size-4', !field.value ? 'opacity-100' : 'opacity-0')} />
                              <span className="text-muted-foreground">None</span>
                            </CommandItem>
                            {subjects?.map((subject) => (
                              <CommandItem
                                value={subject.name}
                                key={subject._id}
                                onSelect={() => {
                                  field.onChange(subject._id)
                                  setSubjectOpen(false)
                                }}
                              >
                                <Check
                                  className={cn('size-4', subject._id === field.value ? 'opacity-100' : 'opacity-0')}
                                />
                                <BookIcon className="size-4" />
                                <span className="truncate">{subject.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) => field.onChange(date?.getTime())}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reminder Time */}
            <FormField
              control={form.control}
              name="reminderTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) => field.onChange(date?.getTime())}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="w-full flex-row justify-end">
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {isEditing ? 'Update Task' : 'Create Task'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default TaskFormSheet
