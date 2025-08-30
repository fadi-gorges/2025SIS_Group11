'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GraduationCapIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { Id } from '../../../../../../convex/_generated/dataModel'

type GradeItemProps = {
  grade: {
    _id: Id<'grades'>
    name: string
    grade: number
  }
  onEdit: () => void
  onDelete: () => void
}

export const GradeItem = ({ grade, onEdit, onDelete }: GradeItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteGrade = useMutation(api.grades.deleteGrade)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteGrade({ gradeId: grade._id })
      toast.success('Grade deleted successfully.')
      onDelete()
    } catch (e: any) {
      toast.error(e?.data || 'Failed to delete grade.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="hover:bg-muted/50 space-y-3 rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCapIcon className="size-4 shrink-0" />
            <h4 className="truncate text-sm font-medium">{grade.name}</h4>
          </div>
          <div className="text-primary text-2xl font-bold">{grade.grade}%</div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="mr-2 size-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
