'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import React from 'react'
import { Doc } from '../../../../../convex/_generated/dataModel'

type AssessmentDueBadgeProps = React.ComponentProps<typeof Badge> & {
  assessment: Doc<'assessments'>
}

export const AssessmentDueBadge = ({ className: _className, assessment, ...props }: AssessmentDueBadgeProps) => {
  if (assessment.complete) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Complete
      </Badge>
    )
  }

  if (!assessment.dueDate) {
    return null
  }

  const now = new Date()
  const dueDate = new Date(assessment.dueDate)

  const timeDiff = dueDate.getTime() - now.getTime()

  if (timeDiff < 0) {
    return (
      <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
        Overdue
      </Badge>
    )
  }

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  const daysDiff = Math.ceil((dueDateOnly.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff > 14) {
    return null
  }

  let text: string
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
  let className = ''

  if (daysDiff === 1) {
    text = 'Tomorrow'
    variant = 'outline'
    className = 'border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100'
  } else if (daysDiff > 1) {
    text = `${daysDiff} days`
    variant = 'outline'
    className = 'border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100'
  } else {
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60))
    const minutesLeft = Math.floor(timeDiff / (1000 * 60))

    if (hoursLeft >= 1) {
      text = `${hoursLeft} hours`
      variant = 'outline'
      className = 'border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100'
    } else if (minutesLeft >= 1) {
      text = `${minutesLeft} minutes`
      variant = 'outline'
      className = 'border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100'
    } else {
      text = 'Due now'
      variant = 'destructive'
      className = 'bg-red-600 hover:bg-red-700'
    }
  }

  return (
    <Badge variant={variant} className={cn(className, _className)} {...props}>
      {text}
    </Badge>
  )
}

export default AssessmentDueBadge
