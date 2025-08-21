import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import React from 'react'

export const BorderedCard = ({ className, ...props }: React.ComponentProps<typeof CardContent>) => (
  <Card className={cn('gap-0 overflow-hidden bg-transparent p-0', className)} {...props} />
)

export const BorderedCardHeader = ({
  middle,
  className,
  ...props
}: React.ComponentProps<typeof CardHeader> & { middle?: boolean }) => (
  <CardHeader
    className={cn('bg-muted dark:bg-card flex w-full items-center border-b py-3!', middle && 'border-t', className)}
    {...props}
  />
)

export const BorderedCardTitle = ({ className, ...props }: React.ComponentProps<typeof CardTitle>) => (
  <p className={cn('text-base', className)} {...props} />
)

export const BorderedCardContent = ({ className, ...props }: React.ComponentProps<typeof CardContent>) => (
  <CardContent className={cn('py-5', className)} {...props} />
)
