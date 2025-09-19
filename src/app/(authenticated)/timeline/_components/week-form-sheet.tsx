'use client'

import DatePicker from '@/components/datetime/date-picker'
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
import { generateWeekName, getSuggestedStartDate } from '@/lib/utils/week-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { useForm } from 'react-hook-form'
import { api } from '../../../../../convex/_generated/api'
import type { Doc } from '../../../../../convex/_generated/dataModel'
import { CreateWeekData, createWeekSchema, VALIDATION_LIMITS } from '../../../../../convex/validation'

type WeekFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isHoliday?: boolean
  weeks: Doc<'weeks'>[]
}

const WeekFormSheet = ({ open, onOpenChange, isHoliday = false, weeks }: WeekFormSheetProps) => {
  const createWeek = useMutation(api.weeks.createWeek)

  const generatedName = generateWeekName(weeks, isHoliday)
  const suggestedStartDate = getSuggestedStartDate(weeks)

  const form = useForm<CreateWeekData>({
    resolver: zodResolver(createWeekSchema as any),
    defaultValues: {
      name: generatedName,
      isHoliday,
      startDate: suggestedStartDate,
      duration: isHoliday ? 1 : undefined,
    },
  })

  const onSubmit = async (values: CreateWeekData) => {
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

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <DatePicker value={new Date(field.value)} onChange={(date) => field.onChange(date?.getTime())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
