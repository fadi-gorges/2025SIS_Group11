'use client'

import { Input } from '@/components/ui/input'
import { useSetSearchParam } from '@/hooks/use-set-search-param'
import { useDebouncedSearch } from '@/lib/utils'
import { SearchIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type SearchInputProps = {
  searchName: string
  className?: string
}

export const SearchInput = ({ searchName, className }: SearchInputProps) => {
  const searchParams = useSearchParams()
  const search = searchParams.get('search') ?? undefined

  const setParam = useSetSearchParam()
  const onSearchChange = useDebouncedSearch((value: string) => setParam('search', value || undefined), 300)

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Input
        defaultValue={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={`Search ${searchName}...`}
        className="pl-8"
      />
      <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
    </div>
  )
}

export default SearchInput
