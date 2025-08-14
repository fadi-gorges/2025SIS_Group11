'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import * as React from 'react'
import { useEffect } from 'react'
import FullPagination from './full-pagination'

/**
 * A reusable data layout component that handles grid/list views, empty states,
 * loading states, and pagination. Automatically reads view and page from search params.
 *
 * @example
 * <GridItem href="/item/1" actions={<ActionsMenu />}>
 *   <div>Item content</div>
 * </GridItem>
 *
 * @example
 * <ListItem href="/item/1" actions={<ActionsMenu />}>
 *   <div>Item content</div>
 * </ListItem>
 *
 * @example
 * <DataLayout
 *   data={items}
 *   itemsPerPage={10}
 *   renderGridItem={(item) => <GridItemComponent item={item} />}
 *   renderListItem={(item) => <ListItemComponent item={item} />}
 *   emptyState={{
 *     title: "No items found",
 *     description: "Try adjusting your search",
 *     icon: SearchIcon
 *   }}
 * />
 */

type EmptyStateConfig = {
  title: string
  description: string
  icon: LucideIcon
  button?: React.ReactNode
}

type DataLayoutProps<T> = React.ComponentProps<'div'> & {
  data: T[] | undefined
  renderGridItem: (item: T, index: number) => React.ReactNode
  renderListItem: (item: T, index: number) => React.ReactNode
  emptyState: EmptyStateConfig
  itemsPerPage?: number
  skeleton?: {
    count?: number
  }
}

type ItemProps = React.ComponentProps<'div'> & {
  href?: string
  actions?: React.ReactNode
}

const GridItem = ({ href, className, children, actions }: ItemProps) => {
  const content = (
    <Card
      className={cn(
        'hover:bg-muted/75 flex h-full flex-col gap-1 p-4 transition-colors',
        actions && 'pr-14',
        className,
      )}
    >
      {children}
    </Card>
  )

  return (
    <div className="relative h-full">
      {href ? (
        <Link href={href} className="block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
      {actions && <div className="absolute top-4 right-4 z-10">{actions}</div>}
    </div>
  )
}

const ListItem = ({ href, className, children, actions }: ItemProps) => {
  const content = (
    <div
      className={cn(
        'hover:bg-muted/75 bg-card flex h-20 items-center gap-3 px-4 transition-colors',
        actions && 'pr-12',
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )

  return (
    <div className="relative">
      {href ? <Link href={href}>{content}</Link> : content}
      {actions && <div className="absolute top-1/2 right-4 z-10 -translate-y-1/2">{actions}</div>}
    </div>
  )
}

const GridLayout = ({ children }: React.ComponentProps<'div'>) => (
  <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
)

const ListLayout = ({ children }: { children: React.ReactNode }) => (
  <Card className="gap-0 divide-y overflow-hidden bg-transparent p-0">{children}</Card>
)

const GridSkeleton = ({ count = 6 }: { count?: number }) => (
  <GridLayout>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} className="flex h-full flex-col gap-1 p-4 opacity-50">
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
  </GridLayout>
)

const ListSkeleton = ({ count = 6 }: { count?: number }) => (
  <Card className="gap-0 divide-y p-0 opacity-50">
    {Array.from({ length: count }).map((_, index) => (
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

const EmptyState = ({ title, description, icon, button }: EmptyStateConfig) => {
  const Icon = icon
  return (
    <Card className="grid min-h-48 place-items-center p-10 text-center">
      <div className="text-muted-foreground flex flex-col items-center gap-3">
        <Icon className="size-8" />
        <p className="text-foreground text-lg font-medium">{title}</p>
        <p className="mb-2 text-sm">{description}</p>
        {button}
      </div>
    </Card>
  )
}

export const DataLayout = <T,>({
  className,
  data,
  itemsPerPage = 10,
  renderGridItem,
  renderListItem,
  emptyState,
  skeleton = { count: 6 },
}: DataLayoutProps<T>) => {
  const router = useRouter()
  const params = useSearchParams()

  const view = (params.get('view') as 'list' | 'grid' | null) ?? 'grid'
  const page = Number(params.get('page') ?? 1)

  const totalItems = data?.length ?? 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedData = data?.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  useEffect(() => {
    if (data !== undefined && totalPages > 0 && (page < 1 || page > totalPages)) {
      const urlParams = new URLSearchParams(params.toString())
      urlParams.set('page', '1')
      router.replace(`?${urlParams.toString()}`)
    }
  }, [page, totalPages, router, params, data])

  const renderContent = () => {
    if (data === undefined) {
      return view === 'grid' ? <GridSkeleton count={skeleton.count} /> : <ListSkeleton count={skeleton.count} />
    }

    if (data.length === 0 && page === 1) {
      return <EmptyState {...emptyState} />
    }

    if (view === 'grid') {
      return <GridLayout>{paginatedData?.map((item, index) => renderGridItem(item, index)) ?? []}</GridLayout>
    }

    return <ListLayout>{paginatedData?.map((item, index) => renderListItem(item, index)) ?? []}</ListLayout>
  }

  return (
    <div className={cn('flex flex-1 flex-col gap-4 pb-6', className)}>
      <div className="flex-1">{renderContent()}</div>
      {totalPages > 1 && (
        <div className="flex justify-center">
          <FullPagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}

export { EmptyState, GridItem, GridLayout, GridSkeleton, ListItem, ListLayout, ListSkeleton }
