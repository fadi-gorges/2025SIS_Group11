'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export const useSetSearchParam = () => {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString())
    if (value && value.length > 0) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}?${next.toString()}`)
  }

  return setParam
}
