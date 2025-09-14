'use client'

import { SimpleCalendar } from '@/components/calendar/simple-calendar'
import SidebarPage from '@/components/sidebar/sidebar-page'
import Heading from '@/components/page/heading'
import { Button } from '@/components/ui/button'
import { PlusIcon, CalendarIcon } from 'lucide-react'

export default function CalendarPage() {
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
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <SimpleCalendar />
        
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
      </div>
    </SidebarPage>
  )
}
