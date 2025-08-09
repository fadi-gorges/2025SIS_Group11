'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSetSearchParam } from './use-set-search-param'

type ConvexPaginationResult<T> = {
  page: T[]
  isDone: boolean
  continueCursor: string
  pageStatus?: 'SplitRecommended' | 'SplitRequired' | 'Exhausted' | null
  splitCursor?: string | null
}

type UseConvexPaginationOptions = {
  itemsPerPage?: number
}

type UseConvexPaginationReturn<T> = {
  currentPage: number
  paginationOpts: { numItems: number; cursor?: string | null }
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  handlePaginationResult: (result: ConvexPaginationResult<T> | undefined) => void
}

export function useConvexPagination<T>({
  itemsPerPage = 12,
}: UseConvexPaginationOptions = {}): UseConvexPaginationReturn<T> {
  const params = useSearchParams()
  const setParam = useSetSearchParam()
  const [paginationState, setPaginationState] = useState<{
    cursors: string[]
    totalItems: number
    isDone: boolean
    maxPageSeen: number
  }>({
    cursors: [''],
    totalItems: 0,
    isDone: false,
    maxPageSeen: 1,
  })

  // Track search/filter params to reset pagination when they change
  const [lastSearchParams, setLastSearchParams] = useState('')

  const currentPage = Math.max(1, parseInt(params.get('page') || '1', 10))

  // Reset pagination state when search/filter parameters change
  useEffect(() => {
    const currentSearchParams = params
      .toString()
      .replace(/page=\d+&?/, '')
      .replace(/&$/, '')
    if (currentSearchParams !== lastSearchParams) {
      setPaginationState({
        cursors: [''],
        totalItems: 0,
        isDone: false,
        maxPageSeen: 1,
      })
      setLastSearchParams(currentSearchParams)

      // If we're not on page 1, reset to page 1
      if (currentPage !== 1) {
        setParam('page', undefined)
      }
    }
  }, [params, lastSearchParams, currentPage, setParam])

  const paginationOpts = useMemo(() => {
    const cursor = paginationState.cursors[currentPage - 1]
    return {
      numItems: itemsPerPage,
      cursor: cursor || null,
    }
  }, [currentPage, itemsPerPage, paginationState.cursors])

  const totalPages = useMemo(() => {
    // If we know we're done (reached the end), use the max page we've seen
    if (paginationState.isDone && currentPage >= paginationState.maxPageSeen) {
      return currentPage
    }

    // If we're done but on an earlier page, use the max page seen
    if (paginationState.isDone) {
      return paginationState.maxPageSeen
    }

    // If not done, always show at least one more page than current
    // But don't go below the max page we've already seen
    return Math.max(currentPage + 1, paginationState.maxPageSeen)
  }, [currentPage, paginationState.isDone, paginationState.maxPageSeen])

  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  const goToPage = (page: number) => {
    if (page === 1) {
      setParam('page', undefined) // Remove page param for page 1
    } else {
      setParam('page', page.toString())
    }
  }

  const handlePaginationResult = (result: ConvexPaginationResult<T> | undefined) => {
    if (!result) return

    setPaginationState((prev) => {
      const newCursors = [...prev.cursors]

      // Ensure we have a cursor for the next page if there is one
      if (!result.isDone && newCursors.length <= currentPage) {
        newCursors[currentPage] = result.continueCursor
      }

      // Update max page seen - this helps prevent jumpiness
      // If result is done and we have items, this is the last page
      // If result is not done, we know there's at least one more page
      let newMaxPageSeen = prev.maxPageSeen

      if (result.isDone) {
        // If we're done and have items on this page, this page is the max
        // If we're done and have no items, the previous page was the max
        newMaxPageSeen = result.page.length > 0 ? currentPage : Math.max(1, currentPage - 1)
      } else {
        // If not done, we know there's at least the current page + 1
        newMaxPageSeen = Math.max(prev.maxPageSeen, currentPage)
      }

      return {
        cursors: newCursors,
        totalItems: prev.totalItems + result.page.length,
        isDone: result.isDone,
        maxPageSeen: newMaxPageSeen,
      }
    })
  }

  return {
    currentPage,
    paginationOpts,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    handlePaginationResult,
  }
}
