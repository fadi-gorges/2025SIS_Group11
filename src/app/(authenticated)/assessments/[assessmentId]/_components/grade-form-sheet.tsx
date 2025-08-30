'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '../../../../../../convex/_generated/api'
import { Id } from '../../../../../../convex/_generated/dataModel'

// Grade form schema
const gradeFormSchema = z.object({
  name: z.string().min(1, 'Grade name is required').max(75, 'Grade name must be no more than 75 characters'),
  grade: z.string().min(1, 'Grade is required'),
})

type GradeFormData = z.infer<typeof gradeFormSchema>

type GradeFormSheetProps = {
  button: React.ReactNode
  assessmentId: Id<'assessments'>
}

export const GradeFormSheet = ({ button, assessmentId }: GradeFormSheetProps) => {
  const [open, setOpen] = useState(false)
  const addGrade = useMutation(api.grades.addGrade)

  const form = useForm<GradeFormData>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      name: '',
      grade: '',
    },
  })

  const onSubmit = async (data: GradeFormData) => {
    try {
      const gradeNumber = parseFloat(data.grade)
      if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > 100) {
        toast.error('Grade must be a valid number between 0 and 100.')
        return
      }
      
      await addGrade({
        name: data.name,
        grade: gradeNumber,
        assessmentId,
      })
      toast.success('Grade has been added successfully.')
      form.reset()
      setOpen(false)
    } catch (e: any) {
      toast.error(e?.data || 'Failed to add grade.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{button}</SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Add Grade</SheetTitle>
          <SheetDescription>
            Add a grade for this assessment to track your performance. 
            <br />
            <span className="text-muted-foreground text-sm">
              Note: The total of all grades for this assessment cannot exceed 100%.
            </span>
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto p-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Name *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={75}
                      placeholder="e.g., Final Report, Presentation, Code Quality"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade (%) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="85.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-xs">
                    Enter a value between 0 and 100. The total of all grades for this assessment cannot exceed 100%.
                  </p>
                </FormItem>
              )}
            />
            <SheetFooter className="w-full flex-row justify-end">
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Add Grade
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
