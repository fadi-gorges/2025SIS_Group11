'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils/cn'
import { FilterIcon } from 'lucide-react'

const FilterSheet = ({ children, ...props }: React.ComponentProps<typeof Sheet>) => {
  return (
    <Sheet {...props}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <FilterIcon className="mr-2 size-4" /> Filter
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 px-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

const FilterSheetSection = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return <div className={cn('space-y-2', className)} {...props} />
}

const FilterSheetSectionTitle = ({ className, ...props }: React.ComponentProps<'p'>) => {
  return <p className={cn('mb-2 font-medium', className)} {...props} />
}

const FilterSheetRadioGroup = ({
  title,
  value,
  onValueChange,
  options,
  className,
  children,
  ...props
}: React.ComponentProps<typeof FilterSheetSection> & {
  title: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{
    value: string
    label: string
    id?: string
  }>
}) => {
  return (
    <FilterSheetSection className={className} {...props}>
      <FilterSheetSectionTitle>{title}</FilterSheetSectionTitle>
      <RadioGroup value={value} onValueChange={onValueChange}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem id={option.id || option.value} value={option.value} />
            <Label htmlFor={option.id || option.value}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </FilterSheetSection>
  )
}

const FilterSheetButtonGroup = ({
  title,
  selectedValue,
  onValueChange,
  options,
  allLabel = 'All',
  className,
  children,
  ...props
}: React.ComponentProps<typeof FilterSheetSection> & {
  title: string
  selectedValue: string
  onValueChange: (value: string | undefined) => void
  options: string[]
  allLabel?: string
}) => {
  const allOptions = [''].concat(options)

  return (
    <FilterSheetSection className={className} {...props}>
      <FilterSheetSectionTitle>{title}</FilterSheetSectionTitle>
      <div className="flex flex-wrap gap-2">
        {allOptions.map((option) => {
          const isAll = option === ''
          const label = isAll ? allLabel : option
          const active = selectedValue === option

          return (
            <Button
              key={label}
              variant={active ? 'secondary' : 'outline'}
              onClick={() => onValueChange(isAll ? undefined : option)}
              className="rounded-md border px-3 py-1 text-sm"
              aria-pressed={active}
            >
              {label}
            </Button>
          )
        })}
      </div>
    </FilterSheetSection>
  )
}

export { FilterSheet, FilterSheetButtonGroup, FilterSheetRadioGroup, FilterSheetSection, FilterSheetSectionTitle }
