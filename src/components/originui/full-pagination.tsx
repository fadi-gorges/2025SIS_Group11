'use client'

import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { usePagination } from '@/hooks/use-pagination'
import { useSetSearchParam } from '@/hooks/use-set-search-param'

type PaginationProps = {
  currentPage: number
  totalPages: number
  paginationItemsToDisplay?: number
}

export default function FullPagination({ currentPage, totalPages, paginationItemsToDisplay = 5 }: PaginationProps) {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay,
  })
  const setParam = useSetSearchParam()

  const handlePageChange = (page: number) => {
    setParam('page', page.toString())
  }

  return (
    <Pagination>
      <PaginationContent>
        {/* First page button */}
        <PaginationItem>
          <PaginationLink
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            onClick={currentPage === 1 ? undefined : () => handlePageChange(1)}
            aria-label="Go to first page"
            aria-disabled={currentPage === 1 ? true : undefined}
          >
            <ChevronFirstIcon size={16} aria-hidden="true" />
          </PaginationLink>
        </PaginationItem>

        {/* Previous page button */}
        <PaginationItem>
          <PaginationLink
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
            aria-label="Go to previous page"
            aria-disabled={currentPage === 1 ? true : undefined}
          >
            <ChevronLeftIcon size={16} aria-hidden="true" />
          </PaginationLink>
        </PaginationItem>

        {/* Left ellipsis (...) */}
        {showLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Page number links */}
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink onClick={() => handlePageChange(page)} isActive={page === currentPage}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Right ellipsis (...) */}
        {showRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Next page button */}
        <PaginationItem>
          <PaginationLink
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            onClick={currentPage === totalPages ? undefined : () => handlePageChange(currentPage + 1)}
            aria-label="Go to next page"
            aria-disabled={currentPage === totalPages ? true : undefined}
          >
            <ChevronRightIcon size={16} aria-hidden="true" />
          </PaginationLink>
        </PaginationItem>

        {/* Last page button */}
        <PaginationItem>
          <PaginationLink
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            onClick={currentPage === totalPages ? undefined : () => handlePageChange(totalPages)}
            aria-label="Go to last page"
            aria-disabled={currentPage === totalPages ? true : undefined}
          >
            <ChevronLastIcon size={16} aria-hidden="true" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
