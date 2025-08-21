'use client'
import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'

const NotificationSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(true)

  return (
    <BorderedCard>
      <BorderedCardHeader>
        <BorderedCardTitle>Notifications</BorderedCardTitle>
      </BorderedCardHeader>
      <BorderedCardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Email notifications</div>
            <div className="text-muted-foreground text-sm">Receive updates about due dates, grades, and activity.</div>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Weekly summary</div>
            <div className="text-muted-foreground text-sm">A summary of your week every Monday morning.</div>
          </div>
          <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} />
        </div>
      </BorderedCardContent>
    </BorderedCard>
  )
}

export default NotificationSettings
