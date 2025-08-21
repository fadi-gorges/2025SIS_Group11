'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSetSearchParam } from '@/hooks/use-set-search-param'
import { useDebouncedSearch } from '@/lib/utils'
import { BookOpenIcon, GridIcon, ListIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type TopBarProps = {
  searchName: string
  children: React.ReactNode
}

export const TopBar = ({ children, searchName }: TopBarProps) => {
  const searchParams = useSearchParams()

  const view = (searchParams.get('view') as 'list' | 'grid' | null) ?? 'grid'
  const search = searchParams.get('search') ?? undefined

  const setParam = useSetSearchParam()
  const onSearchChange = useDebouncedSearch((value: string) => setParam('search', value || undefined), 300)

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full max-w-md">
        <Input
          defaultValue={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${searchName}...`}
          className="pl-8"
        />
        <BookOpenIcon className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        {children}
        <div className="inline-flex rounded-md border">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-none"
            onClick={() => setParam('view', 'grid')}
          >
            <GridIcon className="size-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-none border-r"
            onClick={() => setParam('view', 'list')}
          >
            <ListIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TopBar
