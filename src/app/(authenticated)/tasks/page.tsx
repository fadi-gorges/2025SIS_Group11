'use client'

import { useState, useMemo, useEffect } from 'react'
import Heading from '@/components/page/heading'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Calendar, BookOpen } from 'lucide-react'
import { format, isAfter, isBefore, startOfDay } from 'date-fns'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Mock data
const mockTasks = [
  {
    id: '1',
    title: 'Complete React Assignment',
    description: 'Finish the todo app with hooks',
    subject: 'CS101',
    status: 'todo' as const,
    priority: 'high' as const,
    dueDate: new Date('2024-01-15'),
    weight: 15
  },
  {
    id: '2',
    title: 'Database Design Project',
    description: 'Create ERD for library system',
    subject: 'CS201',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    dueDate: new Date('2024-01-10'),
    weight: 25
  },
  {
    id: '3',
    title: 'Algorithm Analysis Paper',
    description: 'Write analysis of sorting algorithms',
    subject: 'CS301',
    status: 'done' as const,
    priority: 'low' as const,
    dueDate: new Date('2024-01-05'),
    weight: 20
  },
  {
    id: '4',
    title: 'Web Development Final',
    description: 'Build full-stack web application',
    subject: 'CS401',
    status: 'todo' as const,
    priority: 'high' as const,
    dueDate: new Date('2024-01-08'),
    weight: 30
  },
  {
    id: '5',
    title: 'Machine Learning Quiz',
    description: 'Study neural networks and backpropagation',
    subject: 'CS501',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    dueDate: new Date('2024-01-20'),
    weight: 10
  }
]

const mockSubjects = [
  { code: 'CS101', name: 'Introduction to Computer Science' },
  { code: 'CS201', name: 'Database Systems' },
  { code: 'CS301', name: 'Algorithms and Data Structures' },
  { code: 'CS401', name: 'Web Development' },
  { code: 'CS501', name: 'Machine Learning' }
]

type TaskStatus = 'todo' | 'in_progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface Task {
  id: string
  title: string
  description: string
  subject: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date
  weight: number
}

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Helper function to check if task is overdue
  const isOverdue = (task: Task) => {
    return task.status !== 'done' && isBefore(task.dueDate, startOfDay(new Date()))
  }

  // Get unique subjects from tasks
  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(tasks.map(task => task.subject))]
    return uniqueSubjects.map(code => mockSubjects.find(s => s.code === code)!).filter(Boolean)
  }, [tasks])

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject = !selectedSubject || selectedSubject === "all" || task.subject === selectedSubject
      return matchesSearch && matchesSubject
    })

    // Sort by due date
    filtered.sort((a, b) => {
      if (sortBy === 'asc') {
        return a.dueDate.getTime() - b.dueDate.getTime()
      } else {
        return b.dueDate.getTime() - a.dueDate.getTime()
      }
    })

    return filtered
  }, [tasks, searchQuery, selectedSubject, sortBy])

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const overdue = filteredAndSortedTasks.filter(isOverdue)
    const todo = filteredAndSortedTasks.filter(task => !isOverdue(task) && task.status === 'todo')
    const inProgress = filteredAndSortedTasks.filter(task => !isOverdue(task) && task.status === 'in_progress')
    const done = filteredAndSortedTasks.filter(task => task.status === 'done')

    return { overdue, todo, inProgress, done }
  }, [filteredAndSortedTasks])

  const columns = [
    { id: 'overdue', title: 'Over Due', tasks: tasksByColumn.overdue, color: 'text-red-600' },
    { id: 'todo', title: 'To Do', tasks: tasksByColumn.todo, color: 'text-blue-600' },
    { id: 'in_progress', title: 'In Progress', tasks: tasksByColumn.inProgress, color: 'text-amber-600' },
    { id: 'done', title: 'Done', tasks: tasksByColumn.done, color: 'text-green-600' }
  ]

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-amber-500'
      case 'low': return 'bg-gray-500'
    }
  }

  const formatDueDate = (date: Date) => {
    // Ensure consistent date formatting by using UTC
    const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    return format(utcDate, 'MMM dd')
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsCreateOpen(true)
  }

  const handleCreateTask = () => {
    setEditingTask(null)
    setIsCreateOpen(true)
  }

  const handleSaveTask = (taskData: Omit<Task, 'id'>) => {
    if (editingTask) {
      setTasks(tasks.map(task => task.id === editingTask.id ? { ...taskData, id: task.id } : task))
    } else {
      const newTask = { ...taskData, id: Date.now().toString() }
      setTasks([...tasks, newTask])
    }
    setIsCreateOpen(false)
    setEditingTask(null)
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const targetStatus = over.id as string

    // Map column IDs to task statuses
    const statusMap: Record<string, TaskStatus> = {
      'overdue': 'todo', // Overdue tasks go to todo when moved
      'todo': 'todo',
      'in_progress': 'in_progress', 
      'done': 'done'
    }

    const newStatus = statusMap[targetStatus]
    if (!newStatus) return

    // Don't allow dropping on the same status
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Update task status
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const targetStatus = over.id as string

    // Map column IDs to task statuses
    const statusMap: Record<string, TaskStatus> = {
      'overdue': 'todo',
      'todo': 'todo',
      'in_progress': 'in_progress', 
      'done': 'done'
    }

    const newStatus = statusMap[targetStatus]
    if (!newStatus) return

    // Don't allow dropping on the same status
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Update task status immediately for better UX
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))
  }

  if (!isClient) {
    return (
      <SidebarPage breadcrumb={[{ title: 'Tasks' }]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Heading title="Tasks" />
            <Button disabled className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </SidebarPage>
    )
  }

  return (
    <SidebarPage breadcrumb={[{ title: 'Tasks' }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Heading title="Tasks" />
          <Button onClick={handleCreateTask} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-lg">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedSubject || "all"} onValueChange={(value) => setSelectedSubject(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.code} value={subject.code}>
                  {subject.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: 'asc' | 'desc') => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Due Date (Ascending)</SelectItem>
              <SelectItem value="desc">Due Date (Descending)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {columns.map(column => (
              <div key={column.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${column.color}`}>{column.title}</h3>
                  <Badge variant="secondary">{column.tasks.length}</Badge>
                </div>
                
                <DroppableColumn
                  id={column.id}
                  className="space-y-3 min-h-[200px] p-2 rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors hover:border-muted-foreground/40"
                >
                  {column.tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tasks</p>
                    </div>
                  ) : (
                    column.tasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => handleEditTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        isOverdue={isOverdue(task)}
                      />
                    ))
                  )}
                </DroppableColumn>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                isOverdue={isOverdue(activeTask)}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create/Edit Task Modal */}
      {isCreateOpen && (
        <TaskFormSheet
          task={editingTask}
          subjects={mockSubjects}
          onSave={handleSaveTask}
          onClose={() => {
            setIsCreateOpen(false)
            setEditingTask(null)
          }}
        />
      )}
    </SidebarPage>
  )
}

// Droppable Column Component
const DroppableColumn = ({ 
  id, 
  children, 
  className 
}: { 
  id: string
  children: React.ReactNode
  className?: string
}) => {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'border-primary/50 bg-primary/5' : ''}`}
    >
      {children}
    </div>
  )
}

// Task Card Component
const TaskCard = ({ 
  task, 
  onEdit, 
  onDelete, 
  isOverdue 
}: { 
  task: Task
  onEdit: () => void
  onDelete: () => void
  isOverdue: boolean
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
  }
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-amber-500'
      case 'low': return 'bg-gray-500'
    }
  }

  const formatDueDate = (date: Date) => {
    // Ensure consistent date formatting by using UTC
    const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    return format(utcDate, 'MMM dd')
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`group hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
                {task.title}
              </h4>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {task.subject}
                </Badge>
                {task.weight && (
                  <Badge variant="secondary" className="text-xs">
                    {task.weight}%
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// Task Form Sheet Component
const TaskFormSheet = ({ 
  task, 
  subjects, 
  onSave, 
  onClose 
}: { 
  task: Task | null
  subjects: typeof mockSubjects
  onSave: (taskData: Omit<Task, 'id'>) => void
  onClose: () => void
}) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    subject: task?.subject || '',
    status: task?.status || 'todo' as TaskStatus,
    priority: task?.priority || 'medium' as TaskPriority,
    dueDate: task?.dueDate || new Date(),
    weight: task?.weight || 0
  })

  // Prevent hydration mismatch by ensuring consistent date handling
  const [isClient, setIsClient] = useState(false)
  const [dateInputValue, setDateInputValue] = useState(format(task?.dueDate || new Date(), 'dd/MM/yyyy'))
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.subject || formData.subject === "placeholder") {
      newErrors.subject = 'Subject is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSave(formData)
  }

  const isPastDate = isBefore(formData.dueDate, startOfDay(new Date()))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="bg-background w-full max-w-md h-full overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basics Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basics</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Planning Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Planning</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              {isClient && (
                <Input
                  type="text"
                  value={dateInputValue}
                  onChange={(e) => {
                    const value = e.target.value
                    setDateInputValue(value)
                    
                    // Only validate and update form data when complete
                    if (value.length === 10) {
                      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
                      const match = value.match(dateRegex)
                      if (match) {
                        const [, day, month, year] = match
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                        if (!isNaN(date.getTime())) {
                          setFormData({ ...formData, dueDate: date })
                        }
                      }
                    }
                  }}
                  placeholder="dd/mm/yyyy"
                  className={isPastDate ? 'border-red-500' : ''}
                />
              )}
              {isPastDate && (
                <p className="text-xs text-red-500">Due date is in the past</p>
              )}
            </div>
          </div>

          {/* Categorisation Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Categorisation</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject *</label>
              <Select
                value={formData.subject || "placeholder"}
                onValueChange={(value) => setFormData({ ...formData, subject: value })}
              >
                <SelectTrigger className={errors.subject ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select subject</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.code} value={subject.code}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-xs text-red-500">{errors.subject}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.weight || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ ...formData, weight: value === '' ? 0 : parseInt(value) || 0 })
                }}
                placeholder="0"
              />
            </div>
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background border-t p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">* Required fields</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TasksPage
