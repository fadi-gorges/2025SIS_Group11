'use client'

import TimeInput from '@/components/extensions/time-input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import { cn } from '@/lib/utils/cn'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from 'convex/react'
import { format } from 'date-fns'
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'nextjs-toploader/app'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { assessmentIcons, createAssessmentSchema, VALIDATION_LIMITS } from '../../../../../convex/validation'

const createAssessmentWithDueTimeSchema = createAssessmentSchema.extend({
  dueTime: z.string().optional(),
})
type CreateAssessmentWithDueTimeData = z.infer<typeof createAssessmentWithDueTimeSchema>

type AssessmentFormSheetProps = {
  button: React.ReactNode
}

export const AssessmentFormSheet = ({ button }: AssessmentFormSheetProps) => {
  const [open, setOpen] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)
  const router = useRouter()
  const createAssessment = useMutation(api.assessments.createAssessment)
  const subjects = useQuery(api.subjects.getSubjectsByUser, { archived: 'unarchived' })

  const form = useForm<CreateAssessmentWithDueTimeData>({
    resolver: zodResolver(createAssessmentWithDueTimeSchema as any),
    defaultValues: {
      name: '',
      icon: '📝',
      contribution: 'individual',
      weight: 0,
      description: '',
      dueDate: undefined,
      dueTime: '',
      subjectId: '',
    },
  })

  const onSubmit = async (data: CreateAssessmentWithDueTimeData) => {
    try {
      // Combine date and time if both are provided
      let combinedDueDate: number | undefined = undefined
      if (data.dueDate) {
        const date = new Date(data.dueDate)

        if (data.dueTime) {
          const [hours, minutes] = data.dueTime.split(':').map(Number)
          date.setHours(hours, minutes, 0, 0)
        } else {
          // Default to 23:59 if no time is specified
          date.setHours(23, 59, 0, 0)
        }

        combinedDueDate = date.getTime()
      }

      const id = await createAssessment({
        name: data.name,
        icon: data.icon,
        contribution: data.contribution,
        weight: data.weight,
        description: data.description || undefined,
        dueDate: combinedDueDate,
        subjectId: data.subjectId as Id<'subjects'>,
      })
      toast.success('Assessment created')
      form.reset()
      setOpen(false)
      router.push(`/assessments/${id}`)
    } catch (e: any) {
      toast.error(e?.data || 'Failed to create assessment')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{button}</SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>New Assessment</SheetTitle>
          <SheetDescription>Create an assessment to track your academic work.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto p-4">
            {/* Subject Selection */}
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Subject *</FormLabel>
                  <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={subjectOpen}
                          className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                        >
                          {field.value
                            ? subjects?.find((subject) => subject._id === field.value)?.name
                            : 'Select subject...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search subjects..." />
                        <CommandList>
                          <CommandEmpty>No subject found.</CommandEmpty>
                          <CommandGroup>
                            {subjects?.map((subject) => (
                              <CommandItem
                                value={subject.name}
                                key={subject._id}
                                onSelect={() => {
                                  field.onChange(subject._id)
                                  setSubjectOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    subject._id === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {subject.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.ASSESSMENT_NAME_MAX_LENGTH}
                      placeholder="e.g., Final Exam"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-4 gap-4">
                      {assessmentIcons.map((icon) => (
                        <div key={icon} className="flex items-center space-x-2">
                          <RadioGroupItem value={icon} id={icon} className="sr-only" />
                          <label
                            htmlFor={icon}
                            className={cn(
                              'hover:bg-accent flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border text-2xl transition-colors',
                              field.value === icon && 'bg-accent border-ring',
                            )}
                          >
                            {icon}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contribution */}
            <FormField
              control={form.control}
              name="contribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Type</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-row space-x-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <label htmlFor="individual" className="text-sm font-medium">
                          Individual
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="group" id="group" />
                        <label htmlFor="group" className="text-sm font-medium">
                          Group
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weight */}
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MIN}
                      max={VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX}
                      placeholder="e.g., 25"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.getTime())}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Time */}
              <FormField
                control={form.control}
                name="dueTime"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Due Time</FormLabel>
                    <FormControl>
                      <TimeInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      maxLength={VALIDATION_LIMITS.ASSESSMENT_TASK_MAX_LENGTH}
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
                Create Assessment
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default AssessmentFormSheet
