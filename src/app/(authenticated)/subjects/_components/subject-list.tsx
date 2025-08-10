'use client'

import SubjectFormSheet from '@/app/(authenticated)/subjects/_components/subject-form-sheet'
import { DataLayout, GridItem, ListItem } from '@/components/extensions/data-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuery } from 'convex/react'
import { BookOpenIcon, PlusIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'
import { SubjectActionsMenu } from './subject-actions-menu'

export const SubjectList = () => {
  const params = useSearchParams()
  const search = params.get('search') ?? ''
  const archived = (params.get('archived') as 'unarchived' | 'archived' | 'all' | undefined) ?? 'unarchived'
  const term = params.get('term') ?? null
  const hasFilter = !!search || !!term

  const subjects = useQuery(api.subjects.getSubjectsByUser, {
    search,
    archived,
    term,
  })

  const renderGridItem = (s: any) => {
    const badge = s.archived ? <Badge variant="secondary">Archived</Badge> : undefined
    const subtitle = [s.code, s.term].filter(Boolean).join(' • ')

    return (
      <GridItem key={s._id} href={`/subjects/${s._id}`} actions={<SubjectActionsMenu subject={s} />}>
        <div className="flex flex-col gap-1">
          <div className="flex flex-1 gap-2">
            <p className="truncate text-base font-medium">{s.name}</p>
            {badge}
          </div>
          {subtitle && <p className="text-muted-foreground truncate text-sm">{subtitle}</p>}
        </div>
      </GridItem>
    )
  }

  const renderListItem = (s: any) => {
    const badge = s.archived ? <Badge variant="secondary">Archived</Badge> : undefined
    const subtitle = [s.code, s.term].filter(Boolean).join(' • ')

    return (
      <ListItem key={s._id} href={`/subjects/${s._id}`} actions={<SubjectActionsMenu subject={s} />}>
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-medium">{s.name}</p>
          {badge}
        </div>
        {subtitle && <p className="text-muted-foreground truncate text-sm">{subtitle}</p>}
      </ListItem>
    )
  }

  const emptyState = hasFilter
    ? {
        title: 'No subjects found',
        description: 'Try adjusting your search or filters.',
        icon: BookOpenIcon,
      }
    : {
        title: 'No subjects yet',
        description: 'Get started by creating your first subject.',
        icon: BookOpenIcon,
        button: (
          <SubjectFormSheet
            button={
              <Button size="sm">
                <PlusIcon className="size-4" /> Add Subject
              </Button>
            }
          />
        ),
      }

  return (
    <DataLayout
      data={subjects}
      renderGridItem={renderGridItem}
      renderListItem={renderListItem}
      emptyState={emptyState}
    />
  )
}

export default SubjectList
