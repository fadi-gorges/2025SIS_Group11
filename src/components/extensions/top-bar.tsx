'use client'

import { Button } from '@/components/ui/button'
import { useViewStorage } from '@/hooks/use-view-storage'
import { GridIcon, ListIcon } from 'lucide-react'
import { SearchInput } from './search-input'

type TopBarProps = {
  searchName: string
  children: React.ReactNode
}

export const TopBar = ({ children, searchName }: TopBarProps) => {
  const { view, setView } = useViewStorage()

  return (
    <div className="flex items-center gap-2">
      <SearchInput searchName={searchName} />
      <div className="ml-auto flex items-center gap-3">
        {children}
        <div className="inline-flex rounded-md border">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-none"
            onClick={() => setView('grid')}
          >
            <GridIcon className="size-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-none border-r"
            onClick={() => setView('list')}
          >
            <ListIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TopBar
