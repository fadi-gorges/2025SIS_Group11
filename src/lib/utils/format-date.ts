export const formatDate = (date: Date) => {
  return date.toLocaleString('en-AU', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
