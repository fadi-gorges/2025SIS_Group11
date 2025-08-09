export const useDebouncedSearch = (cb: (value: string) => void, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (value: string) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => cb(value), delay)
  }
}
