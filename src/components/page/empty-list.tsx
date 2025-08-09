'use client'

import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

type EmptyListProps = {
  title: string
  description: string
  icon: LucideIcon
  button?: React.ReactNode
}

export const EmptyList = ({ title, description, icon, button }: EmptyListProps) => {
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
