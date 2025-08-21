'use client'

import { FilterSheet, FilterSheetButtonGroup, FilterSheetRadioGroup } from '@/components/extensions/filter-sheet'
import { useSetSearchParam } from '@/hooks/use-set-search-param'
import { Preloaded, usePreloadedQuery } from 'convex/react'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'

const completionOptions = [
  { value: 'all', label: 'All' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'complete', label: 'Complete' },
]

export const AssessmentFilterSheet = ({
  preloadedSubjects,
}: {
  preloadedSubjects: Preloaded<typeof api.subjects.getSubjectsByUser>
}) => {
  const searchParams = useSearchParams()
  const setSearchParam = useSetSearchParam()

  const subjects = usePreloadedQuery(preloadedSubjects)
  const complete = (searchParams.get('complete') as 'all' | 'incomplete' | 'complete' | null) ?? 'all'
  const selectedSubject = searchParams.get('subject') ?? undefined
  const filterCount = [complete !== 'all', selectedSubject !== undefined].filter(Boolean).length

  const subjectOptions = (subjects || []).map((subject) => ({
    value: subject._id,
    label: subject.name,
  }))

  return (
    <FilterSheet filterCount={filterCount}>
      <FilterSheetRadioGroup
        title="Completion Status"
        value={complete}
        onValueChange={(v) => setSearchParam('complete', v)}
        options={completionOptions}
      />
      <FilterSheetButtonGroup
        title="Subject"
        selectedValue={selectedSubject}
        onValueChange={(v) => setSearchParam('subject', v)}
        options={subjectOptions}
        allLabel="All subjects"
      />
    </FilterSheet>
  )
}

export default AssessmentFilterSheet
