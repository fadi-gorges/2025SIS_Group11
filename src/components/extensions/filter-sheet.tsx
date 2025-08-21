'use client'

import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils/cn'
import { FilterIcon } from 'lucide-react'

const FilterSheet = ({
  filterCount,
  children,
  ...props
}: React.ComponentProps<typeof Sheet> & { filterCount?: number }) => {
  return (
    <Sheet {...props}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <FilterIcon className="mr-2 size-4" /> Filter
          {!!filterCount && (
            <Badge className="absolute -top-2 left-full aspect-square min-w-4.5 -translate-x-1/2 rounded-full px-1 text-[0.6rem]">
              {filterCount > 9 ? '9+' : filterCount}
            </Badge>
          )}
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
  options: {
    value: string
    label: string
    id?: string
  }[]
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
  selectedValue: string | undefined
  onValueChange: (value: string | undefined) => void
  options: {
    value: string
    label: string
    id?: string
  }[]
  allLabel?: string
}) => {
  const allOptions = [{ value: '', label: allLabel }].concat(options)

  return (
    <FilterSheetSection className={className} {...props}>
      <FilterSheetSectionTitle>{title}</FilterSheetSectionTitle>
      <div className="flex flex-wrap gap-2 overflow-hidden">
        {allOptions.map((option) => {
          const isAll = option.value === ''
          const label = isAll ? allLabel : option.label
          const active = selectedValue === option.value

          return (
            <Button
              key={label}
              variant={active ? 'secondary' : 'outline'}
              onClick={() => onValueChange(isAll ? undefined : option.value)}
              className="rounded-md border px-3 py-1 text-sm"
              aria-pressed={active}
            >
              <span className="truncate">{label}</span>
            </Button>
          )
        })}
      </div>
    </FilterSheetSection>
  )
}

export { FilterSheet, FilterSheetButtonGroup, FilterSheetRadioGroup, FilterSheetSection, FilterSheetSectionTitle }
