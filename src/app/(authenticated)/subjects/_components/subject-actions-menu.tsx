'use client'

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
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

type SubjectActionsMenuProps = {
  subjectId: Id<'subjects'>
  archived: boolean
}

export const SubjectActionsMenu = ({ subjectId, archived }: SubjectActionsMenuProps) => {
  const router = useRouter()
  const toggleArchive = useMutation(api.subjects.toggleSubjectArchive)
  const deleteSubject = useMutation(api.subjects.deleteSubject)

  const onEdit = () => {
    router.push(`/subjects/${subjectId}`)
  }

  const onToggleArchive = async () => {
    try {
      await toggleArchive({ subjectId })
      toast.success(archived ? 'Subject unarchived' : 'Subject archived')
    } catch {
      toast.error('Failed to update archive state')
    }
  }

  const onDelete = async () => {
    try {
      await deleteSubject({ subjectId })
      toast.success('Subject deleted')
    } catch {
      toast.error('Failed to delete subject')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleArchive}>
          {archived ? (
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
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="text-destructive mr-2 size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SubjectActionsMenu
