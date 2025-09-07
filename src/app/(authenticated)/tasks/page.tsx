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
import { Plus, Search, MoreHorizontal, Calendar, BookOpen, Check, X, GripVertical, ListTodo } from 'lucide-react'
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

// Custom hook for debouncing
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// LocalStorage helpers
const loadTasksFromStorage = (): Task[] => {
  if (typeof window === 'undefined') return persistentMockTasks
  
  try {
    const stored = localStorage.getItem('kanban-tasks')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert date strings back to Date objects and ensure subtasks exist
      const tasks = parsed.map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        subtasks: task.subtasks || []
      }))
      // Update the persistent mock data with stored data
      persistentMockTasks = tasks
      return tasks
    }
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error)
  }
  
  return persistentMockTasks
}

// Helper function to determine task status based on subtasks and due date
const getAutoTaskStatus = (task: Task): TaskStatus => {
  const now = new Date()
  const isOverdue = task.dueDate < now
  
  // If no subtasks, keep current status
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.status
  }
  
  const completedSubtasks = task.subtasks.filter(subtask => subtask.done).length
  const totalSubtasks = task.subtasks.length
  
  // All subtasks completed -> done (regardless of overdue status)
  if (completedSubtasks === totalSubtasks) {
    return 'done'
  }
  
  // At least one subtask completed but not all -> in_progress
  if (completedSubtasks > 0) {
    return 'in_progress'
  }
  
  // No subtasks completed -> todo (this will show as overdue if past due date)
  return 'todo'
}

const saveTasksToStorage = (tasks: Task[]) => {
  if (typeof window === 'undefined') return
  
  try {
    // Update the persistent mock data
    persistentMockTasks = [...tasks]
    // Save to localStorage
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks))
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error)
  }
}

// Mock data
const mockTasks = [
  {
    id: '1',
    title: 'Complete React Assignment',
    description: 'Finish the todo app with hooks',
    subject: 'CS101',
    status: 'todo' as const,
    priority: 'high' as const,
    dueDate: new Date('2025-01-20'),
    subtasks: [
      { id: '1-1', title: 'Set up project structure', done: true, order: 0 },
      { id: '1-2', title: 'Implement useState hook', done: false, order: 1 },
      { id: '1-3', title: 'Add useEffect for data fetching', done: false, order: 2 },
      { id: '1-4', title: 'Write unit tests', done: false, order: 3 }
    ]
  },
  {
    id: '2',
    title: 'Database Design Project',
    description: 'Create ERD for library system',
    subject: 'CS201',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    dueDate: new Date('2025-01-18'),
    subtasks: [
      { id: '2-1', title: 'Identify entities and relationships', done: true, order: 0 },
      { id: '2-2', title: 'Create initial ERD diagram', done: true, order: 1 },
      { id: '2-3', title: 'Normalize to 3NF', done: false, order: 2 },
      { id: '2-4', title: 'Document design decisions', done: false, order: 3 }
    ]
  },
  {
    id: '3',
    title: 'Algorithm Analysis Paper',
    description: 'Write analysis of sorting algorithms',
    subject: 'CS301',
    status: 'done' as const,
    priority: 'low' as const,
    dueDate: new Date('2024-12-15'),
    subtasks: [
      { id: '3-1', title: 'Research sorting algorithms', done: true, order: 0 },
      { id: '3-2', title: 'Implement algorithms in code', done: true, order: 1 },
      { id: '3-3', title: 'Run performance benchmarks', done: true, order: 2 },
      { id: '3-4', title: 'Write analysis and conclusions', done: true, order: 3 }
    ]
  },
  {
    id: '4',
    title: 'Web Development Final',
    description: 'Build full-stack web application',
    subject: 'CS401',
    status: 'todo' as const,
    priority: 'high' as const,
    dueDate: new Date('2025-02-08'),
    subtasks: [
      { id: '4-1', title: 'Set up project structure', done: false, order: 0 },
      { id: '4-2', title: 'Design database schema', done: false, order: 1 },
      { id: '4-3', title: 'Implement user authentication', done: false, order: 2 },
      { id: '4-4', title: 'Create API endpoints', done: false, order: 3 },
      { id: '4-5', title: 'Build frontend components', done: false, order: 4 },
      { id: '4-6', title: 'Add responsive design', done: false, order: 5 },
      { id: '4-7', title: 'Write documentation', done: false, order: 6 }
    ]
  },
  {
    id: '5',
    title: 'Machine Learning Quiz',
    description: 'Study neural networks and backpropagation',
    subject: 'CS501',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    dueDate: new Date('2025-02-20'),
    subtasks: [
      { id: '5-1', title: 'Review neural network basics', done: true, order: 0 },
      { id: '5-2', title: 'Study backpropagation algorithm', done: false, order: 1 },
      { id: '5-3', title: 'Practice with sample problems', done: false, order: 2 }
    ]
  },
  {
    id: '6',
    title: 'Software Engineering Project',
    description: 'Group project for software engineering course',
    subject: 'CS302',
    status: 'todo' as const,
    priority: 'high' as const,
    dueDate: new Date('2025-02-25'),
    subtasks: [
      { id: '6-1', title: 'Form team and assign roles', done: false, order: 0 },
      { id: '6-2', title: 'Define project requirements', done: false, order: 1 },
      { id: '6-3', title: 'Create project timeline', done: false, order: 2 },
      { id: '6-4', title: 'Set up development environment', done: false, order: 3 },
      { id: '6-5', title: 'Implement core features', done: false, order: 4 },
      { id: '6-6', title: 'Write unit tests', done: false, order: 5 },
      { id: '6-7', title: 'Prepare final presentation', done: false, order: 6 }
    ]
  },
  {
    id: '7',
    title: 'Data Structures Assignment',
    description: 'Implement various data structures in C++',
    subject: 'CS201',
    status: 'todo' as const,
    priority: 'medium' as const,
    dueDate: new Date('2025-02-18'),
    subtasks: [
      { id: '7-1', title: 'Implement binary search tree', done: false, order: 0 },
      { id: '7-2', title: 'Create hash table with collision handling', done: false, order: 1 },
      { id: '7-3', title: 'Write heap implementation', done: false, order: 2 },
      { id: '7-4', title: 'Test all implementations', done: false, order: 3 },
      { id: '7-5', title: 'Write performance analysis', done: false, order: 4 }
    ]
  },
  {
    id: '8',
    title: 'Computer Networks Lab',
    description: 'Network simulation and analysis',
    subject: 'CS401',
    status: 'in_progress' as const,
    priority: 'low' as const,
    dueDate: new Date('2025-02-22'),
    subtasks: [
      { id: '8-1', title: 'Set up network simulation environment', done: true, order: 0 },
      { id: '8-2', title: 'Configure network topology', done: true, order: 1 },
      { id: '8-3', title: 'Implement routing protocols', done: false, order: 2 },
      { id: '8-4', title: 'Analyze network performance', done: false, order: 3 },
      { id: '8-5', title: 'Write lab report', done: false, order: 4 }
    ]
  },
  {
    id: '9',
    title: 'Operating Systems Project',
    description: 'Process scheduling simulation',
    subject: 'CS301',
    status: 'in_progress' as const,
    priority: 'high' as const,
    dueDate: new Date('2025-02-28'),
    subtasks: [
      { id: '9-1', title: 'Research scheduling algorithms', done: true, order: 0 },
      { id: '9-2', title: 'Design simulation framework', done: true, order: 1 },
      { id: '9-3', title: 'Implement FCFS scheduler', done: true, order: 2 },
      { id: '9-4', title: 'Implement Round Robin scheduler', done: false, order: 3 },
      { id: '9-5', title: 'Implement Priority scheduler', done: false, order: 4 },
      { id: '9-6', title: 'Compare algorithm performance', done: false, order: 5 },
      { id: '9-7', title: 'Create visualization', done: false, order: 6 }
    ]
  },
  {
    id: '10',
    title: 'Mobile App Development',
    description: 'Create a cross-platform mobile application',
    subject: 'CS402',
    status: 'todo' as const,
    priority: 'medium' as const,
    dueDate: new Date('2025-03-05'),
    subtasks: [
      { id: '10-1', title: 'Choose development framework', done: false, order: 0 },
      { id: '10-2', title: 'Design app wireframes', done: false, order: 1 },
      { id: '10-3', title: 'Set up development environment', done: false, order: 2 },
      { id: '10-4', title: 'Implement user interface', done: false, order: 3 },
      { id: '10-5', title: 'Add core functionality', done: false, order: 4 },
      { id: '10-6', title: 'Test on multiple devices', done: false, order: 5 },
      { id: '10-7', title: 'Deploy to app stores', done: false, order: 6 }
    ]
  }
]

// Global mock data that persists changes
let persistentMockTasks = [...mockTasks]

const mockSubjects = [
  { code: 'CS101', name: 'Introduction to Computer Science' },
  { code: 'CS201', name: 'Database Systems' },
  { code: 'CS202', name: 'Data Structures' },
  { code: 'CS301', name: 'Algorithms and Data Structures' },
  { code: 'CS302', name: 'Software Engineering' },
  { code: 'CS401', name: 'Web Development' },
  { code: 'CS402', name: 'Mobile App Development' },
  { code: 'CS501', name: 'Machine Learning' }
]

type TaskStatus = 'todo' | 'in_progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

type Subtask = { 
  id: string
  title: string
  done: boolean
  order: number
}

interface Task {
  id: string
  title: string
  description: string
  subject: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date
  subtasks?: Subtask[]
}

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasksFromStorage())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false)

  // Debounced save to localStorage
  const debouncedTasks = useDebounce(tasks, 400)
  
  useEffect(() => {
    saveTasksToStorage(debouncedTasks)
  }, [debouncedTasks])

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
    const filtered = tasks.filter(task => {
      // Get subject name for search
      const subjectInfo = mockSubjects.find(subject => subject.code === task.subject)
      const subjectName = subjectInfo?.name || ''
      
      // Check if any subtask matches the search query
      const subtaskMatches = task.subtasks?.some(subtask => 
        subtask.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) || false
      
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           subtaskMatches
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsSubtaskModalOpen(true)
  }

  const handleSaveTask = (taskData: Omit<Task, 'id'>) => {
    if (editingTask) {
      const updatedTask = { ...taskData, id: editingTask.id, subtasks: taskData.subtasks || [] }
      // Auto-update status based on subtasks
      const newStatus = getAutoTaskStatus(updatedTask)
      setTasks(tasks.map(task => task.id === editingTask.id ? { ...updatedTask, status: newStatus } : task))
    } else {
      const newTask = { ...taskData, id: Date.now().toString(), subtasks: taskData.subtasks || [] }
      // Auto-set initial status based on subtasks and due date
      const initialStatus = getAutoTaskStatus(newTask)
      setTasks([...tasks, { ...newTask, status: initialStatus }])
    }
    setIsCreateOpen(false)
    setEditingTask(null)
  }

  // Subtask handlers
  const handleAddSubtask = (taskId: string, title: string) => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newSubtask: Subtask = {
          id: `${taskId}-${Date.now()}`,
          title: trimmedTitle,
          done: false,
          order: (task.subtasks || []).length
        }
        return {
          ...task,
          subtasks: [...(task.subtasks || []), newSubtask]
        }
      }
      return task
    }))
  }

  const handleUpdateSubtask = (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = {
          ...task,
          subtasks: (task.subtasks || []).map(subtask => 
            subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
          )
        }
        // Auto-update task status based on subtask completion
        const newStatus = getAutoTaskStatus(updatedTask)
        return {
          ...updatedTask,
          status: newStatus
        }
      }
      return task
    }))
  }

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = {
          ...task,
          subtasks: (task.subtasks || []).filter(subtask => subtask.id !== subtaskId)
        }
        // Auto-update task status based on remaining subtasks
        const newStatus = getAutoTaskStatus(updatedTask)
        return {
          ...updatedTask,
          status: newStatus
        }
      }
      return task
    }))
  }

  const handleReorderSubtasks = (taskId: string, subtaskIds: string[]) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const reorderedSubtasks = subtaskIds.map((id, index) => {
          const subtask = (task.subtasks || []).find(s => s.id === id)
          return subtask ? { ...subtask, order: index } : null
        }).filter(Boolean) as Subtask[]
        
        return {
          ...task,
          subtasks: reorderedSubtasks
        }
      }
      return task
    }))
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
                placeholder="Search tasks, subtasks, subjects, or descriptions..."
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
                        onClick={() => handleTaskClick(task)}
                        isOverdue={isOverdue(task)}
                      />
                    ))
                  )}
                </DroppableColumn>
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={null} style={{ boxShadow: 'none' }}>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                onClick={() => {}}
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
          onAddSubtask={handleAddSubtask}
          onUpdateSubtask={handleUpdateSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onReorderSubtasks={handleReorderSubtasks}
        />
      )}

      {/* Subtask Modal */}
      {isSubtaskModalOpen && selectedTask && (
        <SubtaskModal
          task={tasks.find(t => t.id === selectedTask.id) || selectedTask}
          onClose={() => {
            setIsSubtaskModalOpen(false)
            setSelectedTask(null)
          }}
          onAddSubtask={handleAddSubtask}
          onUpdateSubtask={handleUpdateSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onReorderSubtasks={handleReorderSubtasks}
        />
      )}
    </SidebarPage>
  )
}

// Subtask Modal Component
const SubtaskModal = ({
  task,
  onClose,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks
}: {
  task: Task
  onClose: () => void
  onAddSubtask: (taskId: string, title: string) => void
  onUpdateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onReorderSubtasks: (taskId: string, subtaskIds: string[]) => void
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background w-full max-w-2xl max-h-[80vh] rounded-lg shadow-lg overflow-hidden">
        <div className="sticky top-0 bg-background border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{task.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {task.subtasks && task.subtasks.length > 0 
                  ? `${task.subtasks.filter(s => s.done).length}/${task.subtasks.length} subtasks complete`
                  : 'No subtasks yet'
                }
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <SubtaskList
            taskId={task.id}
            subtasks={task.subtasks || []}
            onAddSubtask={onAddSubtask}
            onUpdateSubtask={onUpdateSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onReorderSubtasks={onReorderSubtasks}
          />
        </div>
      </div>
    </div>
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
  onClick,
  isOverdue 
}: { 
  task: Task
  onEdit: () => void
  onDelete: () => void
  onClick: () => void
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
    ...(isDragging && {
      animation: 'shake 0.1s infinite',
    }),
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
    <>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(-1px) translateY(-1px); }
          50% { transform: translateX(1px) translateY(1px); }
          75% { transform: translateX(-1px) translateY(1px); }
        }
      `}</style>
      <Card 
        ref={setNodeRef}
        style={style}
        className={`group cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-50' : ''
        }`}
        {...attributes}
        {...listeners}
      >
      <CardContent 
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={(e) => {
          // Don't trigger click if clicking on dropdown, edit button, or their children
          if (!(e.target as HTMLElement).closest('[data-dropdown]') && 
              !(e.target as HTMLElement).closest('[data-edit-button]')) {
            onClick()
          }
        }}
      >
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
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
              
              {/* Subtask Progress */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <ListTodo className="h-3 w-3" />
                  <span>
                    {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} complete
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown>
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
              <DropdownMenuItem onClick={onEdit} data-edit-button>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600" data-edit-button>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
    </>
  )
}

// Subtask List Component
const SubtaskList = ({
  taskId,
  subtasks,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks
}: {
  taskId: string
  subtasks: Subtask[]
  onAddSubtask: (taskId: string, title: string) => void
  onUpdateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onReorderSubtasks: (taskId: string, subtaskIds: string[]) => void
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [error, setError] = useState('')

  const handleAddSubtask = () => {
    const trimmedTitle = newSubtaskTitle.trim()
    if (!trimmedTitle) {
      setError('Subtask title cannot be empty')
      return
    }
    setError('')
    onAddSubtask(taskId, trimmedTitle)
    setNewSubtaskTitle('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSubtask()
    }
  }

  const handleEditStart = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id)
    setEditingTitle(subtask.title)
    setError('')
  }

  const handleEditSave = () => {
    const trimmedTitle = editingTitle.trim()
    if (!trimmedTitle) {
      setError('Subtask title cannot be empty')
      return
    }
    setError('')
    onUpdateSubtask(taskId, editingSubtaskId!, { title: trimmedTitle })
    setEditingSubtaskId(null)
    setEditingTitle('')
  }

  const handleEditCancel = () => {
    setEditingSubtaskId(null)
    setEditingTitle('')
    setError('')
  }

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const handleToggleComplete = (subtaskId: string, done: boolean) => {
    onUpdateSubtask(taskId, subtaskId, { done })
  }

  const handleDelete = (subtaskId: string) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      onDeleteSubtask(taskId, subtaskId)
    }
  }

  // Sort subtasks by order
  const sortedSubtasks = [...subtasks].sort((a, b) => a.order - b.order)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = sortedSubtasks.findIndex(item => item.id === active.id)
    const newIndex = sortedSubtasks.findIndex(item => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = [...sortedSubtasks]
      const [reorderedItem] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, reorderedItem)
      
      const newIds = newOrder.map(item => item.id)
      onReorderSubtasks(taskId, newIds)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-3">
      {/* Add new subtask */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => {
              setNewSubtaskTitle(e.target.value)
              setError('')
            }}
            onKeyPress={handleKeyPress}
            placeholder="Add a subtask..."
            className="flex-1"
            aria-label="Add new subtask"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            aria-label="Add subtask"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>

      {/* Subtasks list */}
      {sortedSubtasks.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No subtasks yet – add one to break down the work</p>
        </div>
      ) : (
        <SortableContext items={sortedSubtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sortedSubtasks.map((subtask) => (
              <SortableSubtaskItem
                key={subtask.id}
                subtask={subtask}
                isEditing={editingSubtaskId === subtask.id}
                editingTitle={editingTitle}
                onEditStart={handleEditStart}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onEditKeyPress={handleEditKeyPress}
                onEditTitleChange={setEditingTitle}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      )}
      </div>
    </DndContext>
  )
}

// Sortable Subtask Item Component
const SortableSubtaskItem = ({
  subtask,
  isEditing,
  editingTitle,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditKeyPress,
  onEditTitleChange,
  onToggleComplete,
  onDelete
}: {
  subtask: Subtask
  isEditing: boolean
  editingTitle: string
  onEditStart: (subtask: Subtask) => void
  onEditSave: () => void
  onEditCancel: () => void
  onEditKeyPress: (e: React.KeyboardEvent) => void
  onEditTitleChange: (title: string) => void
  onToggleComplete: (subtaskId: string, done: boolean) => void
  onDelete: (subtaskId: string) => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging && {
      opacity: 0.5,
    }),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-md border bg-card"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => onToggleComplete(subtask.id, !subtask.done)}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          subtask.done
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground hover:border-primary'
        }`}
        aria-label={subtask.done ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {subtask.done && <Check className="h-3 w-3" />}
      </button>

      {isEditing ? (
        <Input
          value={editingTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={onEditKeyPress}
          onBlur={onEditSave}
          className="flex-1"
          autoFocus
          aria-label="Edit subtask title"
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-pointer ${
            subtask.done ? 'line-through text-muted-foreground' : ''
          }`}
          onClick={() => onEditStart(subtask)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onEditStart(subtask)
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Edit subtask: ${subtask.title}`}
        >
          {subtask.title}
        </span>
      )}

      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onEditSave}
              className="h-6 w-6 p-0"
              aria-label="Save changes"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onEditCancel}
              className="h-6 w-6 p-0"
              aria-label="Cancel editing"
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDelete(subtask.id)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            aria-label={`Delete subtask: ${subtask.title}`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Task Form Sheet Component
const TaskFormSheet = ({ 
  task, 
  subjects, 
  onSave, 
  onClose,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks
}: { 
  task: Task | null
  subjects: typeof mockSubjects
  onSave: (taskData: Omit<Task, 'id'>) => void
  onClose: () => void
  onAddSubtask: (taskId: string, title: string) => void
  onUpdateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onReorderSubtasks: (taskId: string, subtaskIds: string[]) => void
}) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    subject: task?.subject || '',
    status: task?.status || 'todo' as TaskStatus,
    priority: task?.priority || 'medium' as TaskPriority,
    dueDate: task?.dueDate || new Date(),
    subtasks: task?.subtasks || []
  })

  // Prevent hydration mismatch by ensuring consistent date handling
  const [isClient, setIsClient] = useState(false)
  const [dateInputValue, setDateInputValue] = useState(format(task?.dueDate || new Date(), 'dd/MM/yyyy'))
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update formData when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        subject: task.subject,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        subtasks: task.subtasks || []
      })
    }
  }, [task])

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
          </div>

          {/* Checklist Section */}
          {task && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Checklist</h3>
              <SubtaskList
                taskId={task.id}
                subtasks={formData.subtasks}
                onAddSubtask={onAddSubtask}
                onUpdateSubtask={onUpdateSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onReorderSubtasks={onReorderSubtasks}
              />
            </div>
          )}
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
