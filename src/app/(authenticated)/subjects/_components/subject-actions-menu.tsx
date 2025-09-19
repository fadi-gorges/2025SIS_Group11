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
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import * as React from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { Doc } from '../../../../../convex/_generated/dataModel'

type SubjectActionsMenuProps = React.ComponentProps<typeof Button> & {
  subject: Doc<'subjects'>
  onEdit?: () => void
}

export const SubjectActionsMenu = ({ subject, onEdit }: SubjectActionsMenuProps) => {
  const params = useParams()
  const router = useRouter()

  const toggleArchive = useMutation(api.subjects.toggleSubjectArchive)
  const deleteSubject = useMutation(api.subjects.deleteSubject)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = React.useState(false)
  const [isArchiving, setIsArchiving] = React.useState(false)

  const onConfirmArchive = async () => {
    try {
      setIsArchiving(true)
      await toggleArchive({ subjectId: subject._id })
    } catch {
      toast.error('Failed to update archive state')
    } finally {
      setIsArchiving(false)
    }
  }

  const onConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteSubject({ subjectId: subject._id })
    } catch {
      toast.error('Failed to delete subject.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" /> Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setIsArchiveOpen(true)}>
            {subject.archived ? (
              <>
                <ArchiveRestore className="mr-2 size-4" /> Unarchive
              </>
            ) : (
              <>
                <Archive className="mr-2 size-4" /> Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="text-destructive mr-2 size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Credenza open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <CredenzaContent>
          <CredenzaHeader className="overflow-hidden">
            <CredenzaTitle>{subject.archived ? 'Unarchive' : 'Archive'} subject?</CredenzaTitle>
            <CredenzaDescription>
              {subject.archived
                ? 'This will restore the subject to your active subjects list.'
                : 'This will move the subject to your archived subjects. You can restore it later if needed.'}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaFooter withCancel>
            <Button variant="secondary" onClick={onConfirmArchive} loading={isArchiving}>
              {subject.archived ? 'Unarchive' : 'Archive'}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
      <Credenza open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Delete subject?</CredenzaTitle>
            <CredenzaDescription>
              This action cannot be undone. This will permanently delete the subject and remove its associated{' '}
              <b className="text-foreground">assessment, grade and task data</b> from our servers.
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

export default SubjectActionsMenu
