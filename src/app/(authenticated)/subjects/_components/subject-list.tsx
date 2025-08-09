'use client'

import SubjectFormSheet from '@/app/(authenticated)/subjects/_components/subject-form-sheet'
import FullPagination from '@/components/extensions/full-pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from 'convex/react'
import { BookOpenIcon, PlusIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { z } from 'zod'
import { api } from '../../../../../convex/_generated/api'
import { EmptyList } from '../../../../components/page/empty-list'
import { SubjectActionsMenu } from './subject-actions-menu'

const ITEMS_PER_PAGE = 4

const subjectListSchema = z.object({
  search: z.string().optional(),
  archived: z.enum(['unarchived', 'archived', 'all']).optional(),
  term: z.string().optional(),
  page: z.number().min(1).optional(),
})

const SubjectListSkeleton = ({ view }: { view: 'grid' | 'list' }) => {
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="flex flex-col gap-1 p-4 opacity-50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="mt-1 h-4 w-32" />
            <div className="mt-2 ml-auto">
              <Skeleton className="h-7 w-7" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Card className="gap-0 divide-y p-0 opacity-50">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex h-20 items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="mt-1 h-4 w-32" />
          </div>
          <Skeleton className="h-7 w-7" />
        </div>
      ))}
    </Card>
  )
}

export const SubjectList = () => {
  const router = useRouter()
  const params = useSearchParams()
  const search = params.get('search') ?? ''
  const view = (params.get('view') as 'list' | 'grid' | null) ?? 'grid'
  const archived = (params.get('archived') as 'unarchived' | 'archived' | 'all' | undefined) ?? 'unarchived'
  const term = params.get('term') ?? null
  const page = Number(params.get('page') ?? 1)
  const hasFilter = !!search || !!term

  const subjects = useQuery(api.subjects.getSubjectsByUser, {
    search,
    archived,
    term,
  })
  const paginatedSubjects = subjects?.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const totalPages = Math.ceil((subjects?.length ?? 0) / ITEMS_PER_PAGE)

  useEffect(() => {
    const parsedParams = subjectListSchema.safeParse({
      search: search ?? undefined,
      archived: archived ?? undefined,
      term: term ?? undefined,
      page: page ?? undefined,
    })

    if (!parsedParams.success) {
      router.replace('/subjects')
    }
  }, [page, totalPages, router, search, archived, term])

  const renderContent = () => {
    if (subjects === undefined) {
      return <SubjectListSkeleton view={view} />
    }

    if (subjects.length === 0 && page === 1) {
      return hasFilter ? (
        <EmptyList title="No subjects found" description="Try adjusting your search or filters." icon={BookOpenIcon} />
      ) : (
        <EmptyList
          title="No subjects yet"
          description="Get started by creating your first subject."
          icon={BookOpenIcon}
          button={
            <SubjectFormSheet
              button={
                <Button size="sm">
                  <PlusIcon className="size-4" /> Add Subject
                </Button>
              }
            />
          }
        />
      )
    }
    if (view === 'grid') {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedSubjects?.map((s) => (
            <Card key={s._id} className="flex flex-col gap-1 p-4">
              <div className="flex flex-1 gap-2">
                <p className="truncate text-base font-medium">{s.name}</p>
                {s.archived && <Badge variant="secondary">Archived</Badge>}
              </div>
              <p className="text-muted-foreground truncate text-sm">{[s.code, s.term].filter(Boolean).join(' • ')}</p>
              <div className="ml-auto">
                <SubjectActionsMenu subjectId={s._id} archived={s.archived} />
              </div>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <Card className="gap-0 divide-y p-0">
        {paginatedSubjects?.map((s) => (
          <div key={s._id} className="flex h-20 items-center gap-3 px-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-medium">{s.name}</p>
                {s.archived && <Badge variant="secondary">Archived</Badge>}
              </div>
              <p className="text-muted-foreground truncate text-sm">{[s.code, s.term].filter(Boolean).join(' • ')}</p>
            </div>
            <SubjectActionsMenu subjectId={s._id} archived={s.archived} />
          </div>
        ))}
      </Card>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-6">
      <div className="flex-1">{renderContent()}</div>
      {totalPages > 1 && (
        <div className="flex justify-center">
          <FullPagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}

export default SubjectList
