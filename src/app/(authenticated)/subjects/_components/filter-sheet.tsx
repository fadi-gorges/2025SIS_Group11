'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useQuery } from 'convex/react'
import { FilterIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'

const useUrlState = () => {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString())
    if (value && value.length > 0) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}?${next.toString()}`)
  }
  return { params, setParam }
}

export const FilterSheet = () => {
  const { params, setParam } = useUrlState()
  const archived = (params.get('archived') as 'unarchived' | 'archived' | 'all' | null) ?? 'unarchived'
  const terms = useQuery(api.subjects.getUniqueTerms, {})
  const selectedTerm = params.get('term') ?? ''

  const allTerms = terms ? [''].concat(terms) : ['']

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <FilterIcon className="mr-2 size-4" /> Filter
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 px-4">
          <div>
            <p className="mb-2 font-medium">Archive Status</p>
            <RadioGroup value={archived} onValueChange={(v) => setParam('archived', v)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="unarchived" value="unarchived" />
                <Label htmlFor="unarchived">Unarchived</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="archived" value="archived" />
                <Label htmlFor="archived">Archived</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="all" value="all" />
                <Label htmlFor="all">All</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <p className="mb-2 font-medium">Term</p>
            <div className="flex flex-wrap gap-2">
              {allTerms.map((t) => {
                const isAll = t === ''
                const label = isAll ? 'All terms' : t
                const active = selectedTerm === t
                return (
                  <Button
                    key={label}
                    variant={active ? 'secondary' : 'outline'}
                    onClick={() => setParam('term', isAll ? undefined : t)}
                    className="rounded-md border px-3 py-1 text-sm"
                    aria-pressed={active}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default FilterSheet
