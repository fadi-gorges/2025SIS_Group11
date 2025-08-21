'use client'

import SubjectFormSheet from '@/app/(authenticated)/subjects/_components/subject-form-sheet'
import { DataLayout, GridItem, ListItem } from '@/components/extensions/data-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Preloaded, usePreloadedQuery } from 'convex/react'
import { BookIcon, BookOpenIcon, CalendarIcon, HashIcon, PlusIcon } from 'lucide-react'
import { api } from '../../../../../convex/_generated/api'
import { SubjectActionsMenu } from './subject-actions-menu'

export const SubjectList = ({
  preloadedSubjects,
  hasFilter,
}: {
  preloadedSubjects: Preloaded<typeof api.subjects.getSubjectsByUser>
  hasFilter: boolean
}) => {
  const subjects = usePreloadedQuery(preloadedSubjects)

  const renderGridItem = (s: any) => {
    return (
      <GridItem key={s._id} href={`/subjects/${s._id}`} actions={<SubjectActionsMenu subject={s} />}>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <BookIcon className="size-5 shrink-0" />
            <p className="line-clamp-2 text-base font-medium break-words">{s.name}</p>
          </div>
          <div className="-mr-10 space-y-3">
            {(s.code || s.term) && <Separator />}
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
              {s.code && (
                <div className="flex items-center gap-1 overflow-hidden">
                  <HashIcon className="size-4 shrink-0" />
                  <p className="truncate">{s.code}</p>
                </div>
              )}
              {s.term && (
                <div className="flex items-center gap-1 overflow-hidden">
                  <CalendarIcon className="size-4 shrink-0" />
                  <p className="truncate">{s.term}</p>
                </div>
              )}
            </div>
            {s.archived && <Badge variant="secondary">Archived</Badge>}
          </div>
        </div>
      </GridItem>
    )
  }

  const renderListItem = (s: any) => {
    return (
      <ListItem key={s._id} href={`/subjects/${s._id}`} actions={<SubjectActionsMenu subject={s} />}>
        <div className="flex items-center gap-3">
          <BookIcon className="size-5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <p className="truncate text-base font-medium">{s.name}</p>
              {s.archived && <Badge variant="secondary">Archived</Badge>}
            </div>
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              {s.code && (
                <div className="flex items-center gap-1 overflow-hidden">
                  <HashIcon className="size-4 shrink-0" />
                  <p className="truncate">{s.code}</p>
                </div>
              )}
              {s.term && (
                <div className="flex items-center gap-1 overflow-hidden">
                  <CalendarIcon className="size-4 shrink-0" />
                  <p className="truncate">{s.term}</p>
                </div>
              )}
            </div>
          </div>
        </div>
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
