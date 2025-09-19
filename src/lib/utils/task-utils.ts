import {
  CheckCircleIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  CircleEllipsisIcon,
  CircleIcon,
  CircleSlashIcon,
  FileTextIcon,
  ListTodoIcon,
  MinusIcon,
} from 'lucide-react'

// Task type mappings
export const taskTypeMap = {
  task: {
    label: 'Task',
    icon: ListTodoIcon,
  },
  assessment: {
    label: 'Assessment',
    icon: FileTextIcon,
  },
} as const

// Task priority mappings
export const taskPriorityMap = {
  none: {
    label: 'None',
    color: 'text-muted-foreground',
    icon: CircleSlashIcon,
  },
  high: {
    label: 'High',
    color: 'text-destructive',
    icon: ChevronsUpIcon,
  },
  medium: {
    label: 'Medium',
    color: 'text-warning',
    icon: MinusIcon,
  },
  low: {
    label: 'Low',
    color: 'text-primary',
    icon: ChevronsDownIcon,
  },
} as const

// Task status mappings
export const taskStatusMap = {
  todo: {
    label: 'To Do',
    color: 'text-muted-foreground',
    icon: CircleIcon,
  },
  doing: {
    label: 'Doing',
    color: 'text-primary',
    icon: CircleEllipsisIcon,
  },
  done: {
    label: 'Done',
    color: 'text-success',
    icon: CheckCircleIcon,
  },
} as const
