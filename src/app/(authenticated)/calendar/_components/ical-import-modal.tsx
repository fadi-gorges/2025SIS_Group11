'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAction } from 'convex/react'
import { toast } from 'sonner'
import { DownloadIcon, CalendarIcon, AlertCircleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '../../../../../convex/_generated/api'
import { validateICalUrl } from '@/lib/utils/ical-parser'

const importFormSchema = z.object({
  icalUrl: z.string().min(1, 'iCal URL is required'),
  calendarName: z.string().optional(),
})

type ImportFormData = z.infer<typeof importFormSchema>

interface ICalImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

export function ICalImportModal({ open, onOpenChange, onImportComplete }: ICalImportModalProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    importedCount: number
    errors?: string[]
  } | null>(null)

  const importEvents = useAction(api.calendarEvents.importEventsFromICal)

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      icalUrl: '',
      calendarName: '',
    },
  })

  const onSubmit = async (data: ImportFormData) => {
    try {
      setIsImporting(true)
      setImportResult(null)

      // Validate URL format
      const urlValidation = validateICalUrl(data.icalUrl)
      if (!urlValidation.isValid) {
        toast.error(urlValidation.error || 'Invalid URL format')
        return
      }

      // Import events
      const result = await importEvents({
        icalUrl: data.icalUrl,
        calendarName: data.calendarName || undefined,
      })

      setImportResult({
        success: true,
        importedCount: result.importedCount,
      })

      toast.success(`Successfully imported ${result.importedCount} events!`)
      
      // Reset form and close modal after successful import
      setTimeout(() => {
        form.reset()
        onOpenChange(false)
        onImportComplete?.()
      }, 2000)

    } catch (error) {
      console.error('Error importing iCal events:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to import events'
      
      setImportResult({
        success: false,
        importedCount: 0,
        errors: [errorMessage],
      })
      
      toast.error(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isImporting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
        setImportResult(null)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadIcon className="h-5 w-5" />
            Import Calendar
          </DialogTitle>
          <DialogDescription>
            Import events from an external calendar using an iCal URL.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* iCal URL */}
            <FormField
              control={form.control}
              name="icalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>iCal URL *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/calendar.ics or webcal://example.com/calendar.ics"
                      {...field}
                      disabled={isImporting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calendar Name */}
            <FormField
              control={form.control}
              name="calendarName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Work Calendar, School Events"
                      {...field}
                      disabled={isImporting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Help Text */}
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Supported URL formats:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>https://example.com/calendar.ics</li>
                <li>webcal://example.com/calendar.ics</li>
                <li>http://example.com/calendar.ics</li>
              </ul>
            </div>

            {/* Import Result */}
            {importResult && (
              <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  {importResult.success ? (
                    <span className="text-green-800">
                      Successfully imported {importResult.importedCount} events from the calendar.
                    </span>
                  ) : (
                    <span className="text-red-800">
                      {importResult.errors?.join(', ') || 'Failed to import events'}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isImporting}>
                {isImporting ? (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Import Events
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
