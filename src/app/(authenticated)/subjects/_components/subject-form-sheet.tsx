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
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { useRouter } from 'nextjs-toploader/app'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '../../../../../convex/_generated/api'
import { subjectSchema, VALIDATION_LIMITS } from '../../../../../convex/validation'

type SubjectFormSheetProps = {
  button: React.ReactNode
}

export const SubjectFormSheet = ({ button }: SubjectFormSheetProps) => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const createSubject = useMutation(api.subjects.createSubject)

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema as any),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      term: '',
      coordinatorName: '',
      coordinatorEmail: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof subjectSchema>) => {
    try {
      const id = await createSubject({
        name: data.name,
        code: data.code || undefined,
        description: data.description || undefined,
        term: data.term || undefined,
        coordinatorName: data.coordinatorName || undefined,
        coordinatorEmail: data.coordinatorEmail || undefined,
      })
      toast.success('Subject created')
      form.reset()
      setOpen(false)
      router.push(`/subjects/${id}`)
    } catch (e: any) {
      toast.error(e?.data || 'Failed to create subject')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{button}</SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>New Subject</SheetTitle>
          <SheetDescription>Create a subject to organize your assessments.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto p-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.SUBJECT_NAME_MAX_LENGTH}
                      placeholder="e.g., Software Engineering"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.SUBJECT_CODE_MAX_LENGTH}
                      placeholder="e.g., COMP3000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.SUBJECT_TERM_MAX_LENGTH}
                      placeholder="e.g., Semester 1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coordinatorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinator Name</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.COORDINATOR_NAME_MAX_LENGTH}
                      placeholder="e.g., Dr Jane Smith"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coordinatorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinator Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., jane.smith@example.edu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      maxLength={VALIDATION_LIMITS.SUBJECT_DESCRIPTION_MAX_LENGTH}
                      placeholder="Optional details..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="w-full flex-row justify-end">
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Create Subject
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default SubjectFormSheet
