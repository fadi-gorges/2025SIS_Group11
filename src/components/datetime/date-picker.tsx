'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils/cn'
import { CalendarIcon } from 'lucide-react'

type DatePickerProps = {
  value?: Date
  onChange: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const DatePicker = ({ value, onChange, disabled = false, placeholder = 'Pick a date', className }: DatePickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? value.toLocaleDateString() : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          className="rounded-md border"
          captionLayout="dropdown"
          startMonth={new Date(new Date().getFullYear() - 4, new Date().getMonth())}
          endMonth={new Date(new Date().getFullYear() + 4, new Date().getMonth())}
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
