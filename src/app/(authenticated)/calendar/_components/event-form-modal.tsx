'use client'

import DateTimeInput from '@/components/datetime/date-time-input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'

const eventFormSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  date: z.date().optional(),
})

type EventFormData = z.infer<typeof eventFormSchema>

interface EventFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  onEventCreated?: () => void
}

export function EventFormModal({ open, onOpenChange, selectedDate, onEventCreated }: EventFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createEvent = useMutation(api.calendarEvents.createEvent)

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      date: selectedDate,
    },
  })

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true)
      
      if (!data.date) {
        toast.error('Please select a date for the event')
        return
      }
      
      // Save the event to Convex
      await createEvent({
        name: data.name,
        description: data.description,
        date: data.date.getTime(),
        time: data.date ? data.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
      })
      
      toast.success('Event created successfully!')
      form.reset()
      onOpenChange(false)
      onEventCreated?.()
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Create a new event for your calendar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Event Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Team Meeting, Doctor Appointment"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <DateTimeInput
                      value={field.value}
                      onChange={(date: Date | undefined) => field.onChange(date)}
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
                      placeholder="Optional details about the event..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
