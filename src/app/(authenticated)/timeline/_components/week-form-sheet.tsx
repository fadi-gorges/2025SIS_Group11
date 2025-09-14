'use client'

import DateInput from '@/components/datetime/date-input'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/extensions/credenza'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from 'convex/react'
import { addDays } from 'date-fns'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../../../../../convex/_generated/api'
import { VALIDATION_LIMITS, weekSchema } from '../../../../../convex/validation'

type WeekFormValues = z.infer<typeof weekSchema>

type WeekFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isHolidayDefault?: boolean
}

const WeekFormSheet = ({ open, onOpenChange, isHolidayDefault = false }: WeekFormSheetProps) => {
  const generateName = useQuery(api.weeks.generateWeekName, { isHoliday: isHolidayDefault })
  const suggestedStart = useQuery(api.weeks.getSuggestedStartDate, {})
  const createWeek = useMutation(api.weeks.createWeek)

  const form = useForm<WeekFormValues>({
    resolver: zodResolver(weekSchema as any),
    defaultValues: {
      name: generateName || (isHolidayDefault ? 'Holiday' : 'Week 1'),
      isHoliday: isHolidayDefault,
      startDate: suggestedStart ?? Date.now(),
      endDate: addDays(new Date(suggestedStart ?? Date.now()), 7).getTime(),
      duration: isHolidayDefault ? 1 : undefined,
    },
  })

  const startDate = form.watch('startDate')
  const isHoliday = form.watch('isHoliday')
  const duration = form.watch('duration')

  const onSubmit = async (values: WeekFormValues) => {
    await createWeek(values)
    onOpenChange(false)
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{isHoliday ? 'Add holiday' : 'Add week'}</CredenzaTitle>
          <CredenzaDescription>Create a new {isHoliday ? 'holiday' : 'week'} for your timeline.</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input maxLength={VALIDATION_LIMITS.WEEK_NAME_MAX_LENGTH} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date</FormLabel>
                      <FormControl>
                        <DateInput value={new Date(field.value)} onChange={(d) => field.onChange(d.getTime())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End date</FormLabel>
                      <FormControl>
                        <DateInput value={new Date(field.value)} onChange={(d) => field.onChange(d.getTime())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isHoliday && (
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (weeks)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={VALIDATION_LIMITS.HOLIDAY_DURATION_MIN}
                          max={VALIDATION_LIMITS.HOLIDAY_DURATION_MAX}
                          value={(field.value ?? 1).toString()}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="text-muted-foreground text-xs">
                Weeks are 7 days long. Holidays use the duration to set end date.
              </div>
            </form>
          </Form>
        </CredenzaBody>
        <CredenzaFooter withCancel>
          <Button onClick={form.handleSubmit(onSubmit)}>Save</Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}

export default WeekFormSheet
