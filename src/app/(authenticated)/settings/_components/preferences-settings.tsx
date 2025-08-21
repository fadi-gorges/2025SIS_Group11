'use client'
import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import { ModeTabs } from '@/components/theme/mode-tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'

const PreferencesSettings = () => {
  const [timezone, setTimezone] = useState('UTC')

  return (
    <BorderedCard>
      <BorderedCardHeader>
        <BorderedCardTitle>Appearance</BorderedCardTitle>
      </BorderedCardHeader>
      <BorderedCardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Theme</Label>
            <ModeTabs />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                <SelectItem value="America/New_York">America/New_York</SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button">Save preferences</Button>
          <Button type="button" variant="outline">
            Reset
          </Button>
        </div>
      </BorderedCardContent>
    </BorderedCard>
  )
}

export default PreferencesSettings
