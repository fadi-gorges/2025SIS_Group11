'use client'

import { FilterSheet, FilterSheetButtonGroup, FilterSheetRadioGroup } from '@/components/extensions/filter-sheet'
import { useSetSearchParam } from '@/hooks/use-set-search-param'
import { useQuery } from 'convex/react'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'

const archiveOptions = [
  { value: 'unarchived', label: 'Unarchived' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
]

export const SubjectFilterSheet = () => {
  const searchParams = useSearchParams()
  const setSearchParam = useSetSearchParam()

  const archived = (searchParams.get('archived') as 'unarchived' | 'archived' | 'all' | null) ?? 'unarchived'
  const terms = useQuery(api.subjects.getUniqueTerms, {})
  const selectedTerm = searchParams.get('term') ?? ''

  const termOptions = (terms || []).map((term) => ({
    value: term,
    label: term,
  }))

  return (
    <FilterSheet>
      <FilterSheetRadioGroup
        title="Archive Status"
        value={archived}
        onValueChange={(v) => setSearchParam('archived', v)}
        options={archiveOptions}
      />
      <FilterSheetButtonGroup
        title="Term"
        selectedValue={selectedTerm}
        onValueChange={(v) => setSearchParam('term', v)}
        options={termOptions}
        allLabel="All terms"
      />
    </FilterSheet>
  )
}

export default SubjectFilterSheet
