'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, ClockIcon, FileTextIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'

type CalendarItem = {
  id: string
  type: 'event' | 'task' | 'assessment'
  name: string
  description?: string
  date: number
  time?: string
  source: 'calendar' | 'tasks' | 'assessments'
  priority: 'high' | 'medium' | 'low' | 'none'
  status: string
}

interface DateDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  items: CalendarItem[]
}

export function DateDetailsModal({ open, onOpenChange, selectedDate, items }: DateDetailsModalProps) {
  if (!selectedDate) return null

  const getPriorityColor = (priority: string, type: string) => {
    if (type === 'assessment') return 'bg-muted border-l-red-500'
    if (priority === 'high') return 'bg-muted border-l-orange-500'
    if (priority === 'medium') return 'bg-muted border-l-yellow-500'
    if (priority === 'low') return 'bg-muted border-l-green-500'
    return 'bg-muted border-l-blue-500'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <CalendarIcon className="w-4 h-4" />
      case 'task':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'assessment':
        return <AlertCircleIcon className="w-4 h-4" />
      default:
        return <FileTextIcon className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-background/50 text-green-600'
      case 'pending':
        return 'bg-background/50 text-yellow-600'
      case 'scheduled':
        return 'bg-background/50 text-blue-600'
      default:
        return 'bg-background/50 text-muted-foreground'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {items.length === 0 
              ? 'No events or deadlines scheduled for this day'
              : `${items.length} event${items.length !== 1 ? 's' : ''} scheduled`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Free Day</p>
              <p className="text-sm">No events or deadlines scheduled</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-3 rounded-md border-l-4 border bg-muted/50 hover:bg-muted/70 transition-colors',
                  getPriorityColor(item.priority, item.type)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs bg-background/50">
                      {item.type}
                    </Badge>
                    {item.priority !== 'none' && (
                      <Badge variant="outline" className="text-xs bg-background/50">
                        {item.priority}
                      </Badge>
                    )}
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {item.time && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ClockIcon className="w-4 h-4" />
                        <span>{item.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  {item.status && item.status !== 'scheduled' && (
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs bg-background/50', getStatusColor(item.status))}
                    >
                      {item.status}
                    </Badge>
                  )}
                </div>

                {item.source !== 'calendar' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Source: {item.source}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
