'use client'

import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/extensions/credenza'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMutation } from 'convex/react'
import { CheckCircle, Circle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { Doc } from '../../../../../convex/_generated/dataModel'

type AssessmentActionsMenuProps = React.ComponentProps<typeof Button> & {
  assessment: Doc<'assessments'>
  onEdit?: () => void
}

export const AssessmentActionsMenu = ({ assessment, onEdit }: AssessmentActionsMenuProps) => {
  const toggleComplete = useMutation(api.assessments.toggleAssessmentComplete)
  const deleteAssessment = useMutation(api.assessments.deleteAssessment)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isToggling, setIsToggling] = React.useState(false)

  const onToggleComplete = async () => {
    try {
      setIsToggling(true)
      await toggleComplete({ assessmentId: assessment._id })
      toast.success(assessment.complete ? 'Assessment marked as incomplete.' : 'Assessment marked as complete.')
    } catch {
      toast.error('Failed to update completion status.')
    } finally {
      setIsToggling(false)
    }
  }

  const onConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteAssessment({ assessmentId: assessment._id })
      toast.success('Assessment has been deleted.')
      setIsDeleteOpen(false)
    } catch {
      toast.error('Failed to delete assessment.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isToggling}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={onToggleComplete} disabled={isToggling}>
            {assessment.complete ? (
              <>
                <Circle className="mr-2 size-4" /> Mark Incomplete
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 size-4" /> Mark Complete
              </>
            )}
          </DropdownMenuItem>
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" /> Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="text-destructive mr-2 size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Credenza open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Delete assessment?</CredenzaTitle>
            <CredenzaDescription>
              This action cannot be undone. This will permanently delete the assessment and remove its associated{' '}
              <b className="text-foreground">grade data</b> from our servers.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaFooter withCancel>
            <Button variant="destructive" onClick={onConfirmDelete} loading={isDeleting}>
              Delete
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  )
}

export default AssessmentActionsMenu
