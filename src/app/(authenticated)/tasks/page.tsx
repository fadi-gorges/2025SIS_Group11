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
  
  // If no subtasks, allow manual status changes
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.status
  }
  
  const completedSubtasks = task.subtasks.filter(subtask => subtask.done).length
  const totalSubtasks = task.subtasks.length
  
  // ENFORCE AUTOMATIC STATUS BASED ON SUBTASK COMPLETION:
  
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
let persistentMockTasks: Task[] = [...mockTasks]

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
    { 
      id: 'overdue', 
      title: 'Over Due', 
      tasks: tasksByColumn.overdue, 
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: '⚠️'
    },
    { 
      id: 'todo', 
      title: 'To Do', 
      tasks: tasksByColumn.todo, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: '📋'
    },
    { 
      id: 'in_progress', 
      title: 'In Progress', 
      tasks: tasksByColumn.inProgress, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      icon: '⚡'
    },
    { 
      id: 'done', 
      title: 'Done', 
      tasks: tasksByColumn.done, 
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: '✅'
    }
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

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Don't allow dropping on the same status
    if (task.status === newStatus) return

    // DRAG RESTRICTIONS: Check if the drag operation is allowed based on subtask completion
    if (task.subtasks && task.subtasks.length > 0) {
      const completedSubtasks = task.subtasks.filter(subtask => subtask.done).length
      const totalSubtasks = task.subtasks.length
      
      // Define allowed statuses based on completion
      let allowedStatuses: TaskStatus[] = []
      
      if (completedSubtasks === 0) {
        // 0/number done -> Can only go to "To Do" or "Over Due"
        allowedStatuses = ['todo']
      } else if (completedSubtasks === totalSubtasks) {
        // number/number done -> Can only go to "Done"
        allowedStatuses = ['done']
      } else {
        // 1/number done -> Can only go to "In Progress"
        allowedStatuses = ['in_progress']
      }
      
      // Check if the target status is allowed
      if (!allowedStatuses.includes(newStatus)) {
        return // Prevent the drag operation
      }
    }

    // If drag is allowed, update the task status
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

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Check drag restrictions and provide visual feedback
    if (task.subtasks && task.subtasks.length > 0) {
      const completedSubtasks = task.subtasks.filter(subtask => subtask.done).length
      const totalSubtasks = task.subtasks.length
      
      let allowedStatuses: TaskStatus[] = []
      
      if (completedSubtasks === 0) {
        allowedStatuses = ['todo']
      } else if (completedSubtasks === totalSubtasks) {
        allowedStatuses = ['done']
      } else {
        allowedStatuses = ['in_progress']
      }
      
      // If not allowed, prevent the drop
      if (!allowedStatuses.includes(newStatus)) {
        return
      }
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Heading title="Tasks" />
          <Button 
            onClick={handleCreateTask} 
            className="flex items-center gap-2 w-full sm:w-auto h-11"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Create Task</span>
            <span className="xs:hidden">Create</span>
          </Button>
        </div>

        {/* Enhanced Responsive Toolbar */}
        <div className="flex flex-col gap-4 p-4 sm:p-6 bg-gradient-to-r from-card to-card/80 border rounded-xl shadow-sm">
          {/* Search Bar - Full Width on Mobile */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-2 focus:border-primary/50 transition-colors w-full"
              />
            </div>
          </div>
          
          {/* Filters - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={selectedSubject || "all"} onValueChange={(value) => setSelectedSubject(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full h-11 border-2 focus:border-primary/50 transition-colors">
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
              <SelectTrigger className="w-full h-11 border-2 focus:border-primary/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Due Date ↑</SelectItem>
                <SelectItem value="desc">Due Date ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Responsive Kanban Board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {columns.map(column => (
              <div key={column.id} className="space-y-3 lg:space-y-4">
                {/* Responsive Column Header */}
                <div className={`flex items-center justify-between p-3 lg:p-4 rounded-lg ${column.bgColor} border ${column.borderColor}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base lg:text-lg flex-shrink-0">{column.icon}</span>
                    <h3 className={`font-semibold text-sm lg:text-base ${column.color} truncate`}>
                      {column.title}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/80 dark:bg-black/80 text-foreground font-medium text-xs lg:text-sm flex-shrink-0">
                    {column.tasks.length}
                  </Badge>
                </div>
                
                {/* Responsive Droppable Column */}
                <DroppableColumn
                  id={column.id}
                  className={`space-y-2 lg:space-y-3 min-h-[250px] lg:min-h-[300px] p-3 lg:p-4 rounded-xl border-2 border-dashed ${column.borderColor} transition-all duration-200 hover:border-solid hover:shadow-sm ${column.bgColor}`}
                >
                  {column.tasks.length === 0 ? (
                    <div className="text-center py-8 lg:py-12 text-muted-foreground">
                      <div className="text-3xl lg:text-4xl mb-2 lg:mb-3 opacity-60">{column.icon}</div>
                      <p className="text-xs lg:text-sm font-medium">No tasks yet</p>
                      <p className="text-xs mt-1 opacity-75 hidden sm:block">
                        {column.id === 'todo' && 'Create your first task to get started'}
                        {column.id === 'in_progress' && 'Move tasks here when you start working'}
                        {column.id === 'done' && 'Completed tasks will appear here'}
                        {column.id === 'overdue' && 'Tasks past their due date'}
                      </p>
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

// Enhanced Subtask Modal Component
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
  const completedSubtasks = task.subtasks?.filter(s => s.done).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-background w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] rounded-xl shadow-2xl overflow-hidden border">
        {/* Responsive Header */}
        <div className="sticky top-0 bg-gradient-to-r from-background to-background/95 border-b p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold mb-2 truncate">{task.title}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {task.subject}
                  </Badge>
                  <span className="hidden sm:inline">•</span>
                  <span className="sm:hidden block">Due {format(task.dueDate, 'MMM dd, yyyy')}</span>
                  <span className="hidden sm:inline">Due {format(task.dueDate, 'MMM dd, yyyy')}</span>
                </div>
              </div>
              
              {/* Responsive Progress Bar */}
              {totalSubtasks > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{completedSubtasks}/{totalSubtasks} complete</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-muted/80 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Responsive Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh] sm:max-h-[60vh]">
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

// Enhanced Droppable Column Component
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
      className={`${className} transition-all duration-200 ${
        isOver 
          ? 'border-primary/60 bg-primary/10 scale-[1.02] shadow-lg' 
          : 'hover:border-primary/30'
      }`}
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

  const completedSubtasks = task.subtasks?.filter(s => s.done).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(-1px) translateY(-1px); }
          50% { transform: translateX(1px) translateY(1px); }
          75% { transform: translateX(-1px) translateY(1px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <Card 
        ref={setNodeRef}
        style={style}
        className={`group cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] ${
          isDragging ? 'opacity-50 rotate-1 sm:rotate-2' : ''
        } ${isOverdue ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' : 'border-border'}`}
        {...attributes}
        {...listeners}
      >
      <CardContent 
        className="p-3 sm:p-4 lg:p-5 cursor-pointer hover:bg-muted/30 transition-all duration-200"
        onClick={(e) => {
          // Don't trigger click if clicking on dropdown, edit button, or their children
          if (!(e.target as HTMLElement).closest('[data-dropdown]') && 
              !(e.target as HTMLElement).closest('[data-edit-button]')) {
            onClick()
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1 sm:mt-1.5 flex-shrink-0 ${getPriorityColor(task.priority)} shadow-sm`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm leading-tight mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {task.title}
              </h4>
              
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                <Badge variant="outline" className="text-xs font-medium bg-background/80">
                  {task.subject}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    Overdue
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 sm:mb-3">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className={`truncate ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                  Due {formatDueDate(task.dueDate)}
                </span>
              </div>
              
              {/* Enhanced Responsive Subtask Progress */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 min-w-0">
                      <ListTodo className="h-3 w-3 flex-shrink-0" />
                      <span className="hidden sm:inline">Progress</span>
                      <span className="sm:hidden">Prog</span>
                    </div>
                    <span className="font-medium flex-shrink-0">
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 sm:h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-muted/80 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 sm:w-48">
              <DropdownMenuItem onClick={onEdit} data-edit-button className="cursor-pointer text-xs sm:text-sm">
                <span>Edit Task</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600 cursor-pointer text-xs sm:text-sm" data-edit-button>
                <span>Delete Task</span>
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
      <div className="space-y-4">
      {/* Enhanced Responsive Add new subtask */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => {
              setNewSubtaskTitle(e.target.value)
              setError('')
            }}
            onKeyPress={handleKeyPress}
            placeholder="Add a new subtask..."
            className="flex-1 h-10 sm:h-11 border-2 focus:border-primary/50 transition-colors"
            aria-label="Add new subtask"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            aria-label="Add subtask"
            className="h-10 sm:h-11 px-3 sm:px-4 bg-primary hover:bg-primary/90 transition-colors w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-md">
            <X className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>

      {/* Enhanced Responsive Subtasks list */}
      {sortedSubtasks.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 opacity-60">📝</div>
          <p className="text-xs sm:text-sm font-medium">No subtasks yet</p>
          <p className="text-xs mt-1 opacity-75 hidden sm:block">Add subtasks to break down your work into manageable steps</p>
        </div>
      ) : (
        <SortableContext items={sortedSubtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 sm:space-y-3">
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
      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card transition-all duration-200 hover:shadow-sm ${
        isDragging ? 'opacity-50 rotate-1' : ''
      } ${subtask.done ? 'bg-muted/50' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>

      <button
        type="button"
        onClick={() => onToggleComplete(subtask.id, !subtask.done)}
        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 flex-shrink-0 ${
          subtask.done
            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
            : 'border-muted-foreground hover:border-primary hover:bg-primary/10'
        }`}
        aria-label={subtask.done ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {subtask.done && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
      </button>

      {isEditing ? (
        <Input
          value={editingTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={onEditKeyPress}
          onBlur={onEditSave}
          className="flex-1 h-7 sm:h-8 border-2 focus:border-primary/50 text-xs sm:text-sm"
          autoFocus
          aria-label="Edit subtask title"
        />
      ) : (
        <span
          className={`flex-1 text-xs sm:text-sm cursor-pointer transition-colors hover:text-primary min-w-0 ${
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

      <div className="flex items-center gap-1 flex-shrink-0">
        {isEditing ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onEditSave}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
              aria-label="Save changes"
            >
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onEditCancel}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
              aria-label="Cancel editing"
            >
              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDelete(subtask.id)}
            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            aria-label={`Delete subtask: ${subtask.title}`}
          >
            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50">
      <div className="bg-background w-full max-w-md h-full overflow-y-auto border-l shadow-2xl">
        {/* Responsive Header */}
        <div className="sticky top-0 bg-gradient-to-r from-background to-background/95 border-b p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold">
                {task ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {task ? 'Update task details and subtasks' : 'Add a new task to your board'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-muted/80 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Enhanced Basics Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                className={`h-11 border-2 transition-colors ${errors.title ? 'border-red-500 focus:border-red-500' : 'focus:border-primary/50'}`}
              />
              {errors.title && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-md">
                  <X className="h-3 w-3" />
                  {errors.title}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                className="w-full min-h-[100px] px-4 py-3 border-2 border-input rounded-lg resize-none focus:outline-none focus:border-primary/50 transition-colors bg-background"
              />
            </div>
          </div>

          {/* Enhanced Planning Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-foreground">Planning & Priority</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs sm:text-sm font-medium text-foreground">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-10 sm:h-11 border-2 focus:border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">📋 To Do</SelectItem>
                    <SelectItem value="in_progress">⚡ In Progress</SelectItem>
                    <SelectItem value="done">✅ Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs sm:text-sm font-medium text-foreground">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="h-10 sm:h-11 border-2 focus:border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-medium text-foreground">Due Date</label>
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
                  className={`h-10 sm:h-11 border-2 transition-colors ${isPastDate ? 'border-red-500 focus:border-red-500' : 'focus:border-primary/50'}`}
                />
              )}
              {isPastDate && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-md">
                  <X className="h-3 w-3" />
                  Due date is in the past
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Categorisation Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-foreground">Categorisation</h3>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Subject *</label>
              <Select
                value={formData.subject || "placeholder"}
                onValueChange={(value) => setFormData({ ...formData, subject: value })}
              >
                <SelectTrigger className={`h-11 border-2 transition-colors ${errors.subject ? 'border-red-500 focus:border-red-500' : 'focus:border-primary/50'}`}>
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
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-md">
                  <X className="h-3 w-3" />
                  {errors.subject}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Checklist Section */}
          {task && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Task Checklist</h3>
              </div>
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

          {/* Enhanced Categorisation Section */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-foreground">Categorisation</h3>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-medium text-foreground">Subject *</label>
              <Select
                value={formData.subject || "placeholder"}
                onValueChange={(value) => setFormData({ ...formData, subject: value })}
              >
                <SelectTrigger className={`h-10 sm:h-11 border-2 transition-colors ${errors.subject ? 'border-red-500 focus:border-red-500' : 'focus:border-primary/50'}`}>
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
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-md">
                  <X className="h-3 w-3" />
                  {errors.subject}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Checklist Section */}
          {task && (
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Task Checklist</h3>
              </div>
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

        {/* Enhanced Responsive Sticky Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-background to-background/95 border-t p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-4 bg-muted-foreground rounded-full"></div>
              <span>* Required fields</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button variant="ghost" onClick={onClose} className="hover:bg-muted/80 transition-colors flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 transition-colors flex-1 sm:flex-none">
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
