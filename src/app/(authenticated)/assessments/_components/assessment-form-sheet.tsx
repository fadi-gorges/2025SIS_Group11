'use client'

import DateTimeInput from '@/components/datetime/date-time-input'
import { Button } from '@/components/ui/button'
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
import { Check, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'nextjs-toploader/app'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import {
  assessmentIcons,
  CreateAssessmentData,
  createAssessmentSchema,
  VALIDATION_LIMITS,
} from '../../../../../convex/validation'

type AssessmentFormSheetProps = {
  button: React.ReactNode
}

export const AssessmentFormSheet = ({ button }: AssessmentFormSheetProps) => {
  const [open, setOpen] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)
  const router = useRouter()
  const createAssessment = useMutation(api.assessments.createAssessment)
  const subjects = useQuery(api.subjects.getSubjectsByUser, { archived: 'unarchived' })

  const form = useForm<CreateAssessmentData>({
    resolver: zodResolver(createAssessmentSchema as any),
    defaultValues: {
      name: '',
      icon: '📝',
      contribution: 'individual',
      weight: 0,
      description: '',
      dueDate: undefined,
      subjectId: '',
    },
  })

  const onSubmit = async (data: CreateAssessmentData) => {
    try {
      const id = await createAssessment({
        name: data.name,
        icon: data.icon,
        contribution: data.contribution,
        weight: data.weight,
        description: data.description || undefined,
        dueDate: data.dueDate,
        subjectId: data.subjectId as Id<'subjects'>,
      })
      toast.success('Assessment has been created.')
      form.reset()
      setOpen(false)
      router.push(`/assessments/${id}`)
    } catch (e: any) {
      toast.error(e?.data || 'Failed to create assessment.')
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-x-hidden overflow-y-auto p-4">
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
                          className={cn('w-full justify-between truncate', !field.value && 'text-muted-foreground')}
                        >
                          {field.value
                            ? subjects?.find((subject) => subject._id === field.value)?.name
                            : 'Select subject...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-sm p-0">
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
                                    'mr-2 size-4',
                                    subject._id === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                <span className="truncate">{subject.name}</span>
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
                      value={field.value.toString()}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <DateTimeInput
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) => field.onChange(date?.getTime())}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
