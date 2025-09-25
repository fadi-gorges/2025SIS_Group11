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
import { startOfDay, startOfToday } from 'date-fns'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import type { Doc } from '../../../../../convex/_generated/dataModel'
import { VALIDATION_LIMITS, WeekFormData, weekFormSchema } from '../../../../../convex/validation'

type WeekFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isHoliday?: boolean
  weeks?: Doc<'weeks'>[]
  weekToEdit?: Doc<'weeks'>
}

const WeekFormDialog = ({ open, onOpenChange, isHoliday = false, weeks, weekToEdit }: WeekFormDialogProps) => {
  const createWeek = useMutation(api.weeks.createWeek)
  const updateWeek = useMutation(api.weeks.updateWeek)

  const isEditing = !!weekToEdit

  const defaultName = isEditing ? weekToEdit.name : weeks ? generateWeekName(weeks, isHoliday) : ''
  const defaultStartDate = isEditing
    ? weekToEdit.startDate
    : weeks
      ? getSuggestedStartDate(weeks)
      : startOfToday().getTime()

  const form = useForm<WeekFormData>({
    resolver: zodResolver(weekFormSchema as any),
    defaultValues: {
      name: defaultName,
      startDate: defaultStartDate,
      isHoliday: isEditing ? weekToEdit.isHoliday : isHoliday,
      duration: isEditing
        ? weekToEdit.isHoliday
          ? Math.round((weekToEdit.endDate - weekToEdit.startDate) / (7 * 24 * 60 * 60 * 1000))
          : undefined
        : isHoliday
          ? 1
          : undefined,
    },
  })

  const onSubmit = async (values: WeekFormData) => {
    try {
      if (isEditing) {
        await updateWeek({
          weekId: weekToEdit._id,
          name: values.name,
          startDate: values.startDate,
          duration: values.duration,
        })
      } else {
        await createWeek(values)
      }
    } catch (e: any) {
      toast.error(e?.data || 'Failed to update week.')
    }
    onOpenChange(false)
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            {isEditing ? `Edit ${weekToEdit.isHoliday ? 'holiday' : 'week'}` : isHoliday ? 'Add holiday' : 'Add week'}
          </CredenzaTitle>
          <CredenzaDescription>
            {isEditing
              ? `Update the details for ${weekToEdit.name}.`
              : `Create a new ${isHoliday ? 'holiday' : 'week'} for your timeline.`}
          </CredenzaDescription>
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
                      <DatePicker
                        value={new Date(field.value)}
                        onChange={(date) => field.onChange(startOfDay(date ?? new Date()).getTime())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(isEditing ? weekToEdit.isHoliday : isHoliday) && (
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
          <Button onClick={form.handleSubmit(onSubmit)}>{isEditing ? 'Update' : 'Save'}</Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}

export default WeekFormDialog
