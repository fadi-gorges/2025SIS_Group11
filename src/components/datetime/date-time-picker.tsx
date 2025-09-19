'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/format-date'
import { CalendarIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import DateInput from './date-input'
import TimeInput from './time-input'

type DateTimePickerProps = Omit<React.ComponentProps<typeof Button>, 'onChange' | 'value'> & {
  showIcon?: boolean
  value?: Date
  onChange: (date: Date | undefined) => void
}

const DateTimePicker = ({
  value,
  onChange,
  disabled,
  className,
  children,
  showIcon = true,
  ...props
}: DateTimePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(value)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setDate(value ? new Date(value) : undefined)
  }, [value])

  const handleDateChange = (newDate: Date) => {
    if (disabled) return

    const updatedDate = new Date(newDate)
    if (date) {
      updatedDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
    }

    setDate(updatedDate)
    onChange(updatedDate)
  }

  const handleTimeChange = (newTime: Date) => {
    if (disabled || !date) return

    const updatedDate = new Date(date)
    updatedDate.setHours(newTime.getHours(), newTime.getMinutes(), newTime.getSeconds(), newTime.getMilliseconds())

    setDate(updatedDate)
    onChange(updatedDate)
  }

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (disabled) return

    if (selectedDate) {
      const updatedDate = new Date(selectedDate)
      if (date) {
        updatedDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
      }
      setDate(updatedDate)
      onChange(updatedDate)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setDate(undefined)
    onChange(undefined)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn('flex-1 justify-between text-left font-normal', !date && 'text-muted-foreground')}
            disabled={disabled}
            {...props}
          >
            <div className="flex items-center">
              {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
              {date ? formatDate(date) : 'Pick a date and time'}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex flex-col space-y-3">
            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleCalendarSelect}
                disabled={disabled}
                className="rounded-md border"
                captionLayout="dropdown"
                startMonth={new Date(new Date().getFullYear() - 4, new Date().getMonth())}
                endMonth={new Date(new Date().getFullYear() + 4, new Date().getMonth())}
              />
            </div>

            {/* Date and Time Inputs */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <DateInput value={date} onChange={handleDateChange} disabled={disabled || !date} />
              <TimeInput value={date} onChange={handleTimeChange} disabled={disabled || !date} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {date && !disabled && (
        <Button type="button" variant="outline" size="icon" onClick={handleClear} className="text-destructive">
          <X />
        </Button>
      )}
    </div>
  )
}

export default DateTimePicker
