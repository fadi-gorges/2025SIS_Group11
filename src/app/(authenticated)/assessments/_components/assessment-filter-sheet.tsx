'use client'

import { FilterSheet, FilterSheetButtonGroup, FilterSheetRadioGroup } from '@/components/extensions/filter-sheet'
import { useSetSearchParam } from '@/hooks/use-set-search-param'
import { useQuery } from 'convex/react'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'

const completionOptions = [
  { value: 'all', label: 'All' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'complete', label: 'Complete' },
]

export const AssessmentFilterSheet = () => {
  const searchParams = useSearchParams()
  const setSearchParam = useSetSearchParam()

  const complete = (searchParams.get('complete') as 'all' | 'incomplete' | 'complete' | null) ?? 'all'
  const subjects = useQuery(api.subjects.getSubjectsByUser, { archived: 'unarchived' })
  const selectedSubject = searchParams.get('subject') ?? ''

  const subjectOptions = (subjects || []).map((subject) => ({
    value: subject._id,
    label: subject.name,
  }))

  return (
    <FilterSheet>
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
