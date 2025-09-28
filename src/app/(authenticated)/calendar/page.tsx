'use client'

import { useState } from 'react'
import { SimpleCalendar } from '@/components/calendar/simple-calendar'
import SidebarPage from '@/components/sidebar/sidebar-page'
import Heading from '@/components/page/heading'
import { Button } from '@/components/ui/button'
import { PlusIcon, CalendarIcon, DownloadIcon } from 'lucide-react'
import { EventFormModal } from './_components/event-form-modal'
import { ICalImportModal } from './_components/ical-import-modal'
import { Doc } from '../../../../convex/_generated/dataModel'

type CalendarEvent = Doc<'calendarEvents'>

export default function CalendarPage() {
  const [showEventForm, setShowEventForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([])

  const handleAddEvent = () => {
    setShowEventForm(true)
  }

  const handleImportCalendar = () => {
    setShowImportModal(true)
  }

  const handleDateSelect = (date: Date, events: CalendarEvent[]) => {
    setSelectedDate(date)
    setSelectedEvents(events)
  }

  const handleEventCreated = () => {
    // Events will automatically refresh due to Convex reactivity
    // No manual refresh needed
  }

  const handleImportComplete = () => {
    // Events will automatically refresh due to Convex reactivity
    // No manual refresh needed
  }

  return (
    <SidebarPage>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Heading 
            title="Calendar" 
            description="View your schedule and upcoming events" 
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleImportCalendar}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Import Calendar
            </Button>
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={handleAddEvent}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <SimpleCalendar onDateSelect={handleDateSelect} />
        
        {/* Placeholder for future features */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Quick Stats</h3>
            <p className="text-sm text-muted-foreground">
              Calendar statistics and insights will appear here.
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Upcoming Events</h3>
            <p className="text-sm text-muted-foreground">
              Your upcoming events and deadlines will be shown here.
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Recent calendar activity and changes will be displayed here.
            </p>
          </div>
        </div>

        {/* Event Form Modal */}
        <EventFormModal
          open={showEventForm}
          onOpenChange={setShowEventForm}
          selectedDate={selectedDate}
          onEventCreated={handleEventCreated}
        />

        {/* iCal Import Modal */}
        <ICalImportModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          onImportComplete={handleImportComplete}
        />
      </div>
    </SidebarPage>
  )
}
