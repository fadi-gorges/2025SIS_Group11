'use client'

import { FilterSheet, FilterSheetButtonGroup, FilterSheetRadioGroup } from '@/components/extensions/filter-sheet'
import { useSetSearchParam } from '@/hooks/use-set-search-param'
import { Preloaded, usePreloadedQuery } from 'convex/react'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'

const archiveOptions = [
  { value: 'unarchived', label: 'Unarchived' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
]

export const SubjectFilterSheet = ({
  preloadedTerms,
}: {
  preloadedTerms: Preloaded<typeof api.subjects.getUniqueTerms>
}) => {
  const searchParams = useSearchParams()
  const setSearchParam = useSetSearchParam()

  const archived = (searchParams.get('archived') as 'unarchived' | 'archived' | 'all' | null) ?? 'unarchived'
  const terms = usePreloadedQuery(preloadedTerms)
  const selectedTerm = searchParams.get('term') ?? undefined
  const filterCount = [archived !== 'unarchived', selectedTerm !== undefined].filter(Boolean).length

  const termOptions = (terms || []).map((term) => ({
    value: term,
    label: term,
  }))

  return (
    <FilterSheet filterCount={filterCount}>
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
