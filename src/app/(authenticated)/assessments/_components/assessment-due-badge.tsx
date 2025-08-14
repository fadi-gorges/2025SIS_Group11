'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ClockIcon } from 'lucide-react'
import React from 'react'
import { Doc } from '../../../../../convex/_generated/dataModel'

type AssessmentDueBadgeProps = React.ComponentProps<typeof Badge> & {
  assessment: Doc<'assessments'>
}

export const AssessmentDueBadge = ({ className, assessment, ...props }: AssessmentDueBadgeProps) => {
  if (assessment.complete) {
    return <Badge variant="success">Complete</Badge>
  }

  if (!assessment.dueDate) {
    return null
  }

  const now = new Date()
  const dueDate = new Date(assessment.dueDate)

  const timeDiff = dueDate.getTime() - now.getTime()

  if (timeDiff < 0) {
    return <Badge variant="destructive">Overdue</Badge>
  }

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  const daysDiff = Math.ceil((dueDateOnly.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff > 14) {
    return null
  }

  let text: string

  if (daysDiff === 1) {
    text = 'Tomorrow'
  } else if (daysDiff > 1) {
    text = `${daysDiff} days`
  } else {
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60))
    const minutesLeft = Math.floor(timeDiff / (1000 * 60))

    if (hoursLeft >= 1) {
      text = hoursLeft === 1 ? '1 hour' : `${hoursLeft} hours`
    } else if (minutesLeft >= 1) {
      text = minutesLeft === 1 ? '1 minute' : `${minutesLeft} minutes`
    } else {
      text = 'Due now'
    }
  }

  return (
    <Badge variant="warning" className={cn(className)} {...props}>
      <ClockIcon className="size-4" />
      {text}
    </Badge>
  )
}

export default AssessmentDueBadge
