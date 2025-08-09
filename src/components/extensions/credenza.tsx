'use client'

import * as React from 'react'

import { buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils/cn'

interface BaseProps {
  children: React.ReactNode
}

interface RootCredenzaProps extends BaseProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface CredenzaProps extends BaseProps {
  className?: string
  asChild?: true
}

const Credenza = ({ children, ...props }: RootCredenzaProps) => {
  const isMobile = useIsMobile()
  const Credenza = isMobile ? Drawer : Dialog
  return <Credenza {...props}>{children}</Credenza>
}

const CredenzaTrigger = ({ className, ...props }: CredenzaProps) => {
  const isMobile = useIsMobile()
  const CredenzaTrigger = isMobile ? DrawerTrigger : DialogTrigger
  return <CredenzaTrigger className={className} {...props} />
}

const CredenzaCancel = ({ className, ...props }: CredenzaProps) => {
  const isMobile = useIsMobile()
  const CredenzaClose = isMobile ? DrawerClose : DialogClose
  return <CredenzaClose className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} />
}

const CredenzaContent = ({ className, ...props }: CredenzaProps) => {
  const isMobile = useIsMobile()
  const CredenzaContent = isMobile ? DrawerContent : DialogContent
  return <CredenzaContent className={className} {...props} />
}

const CredenzaDescription = ({ className, ...props }: CredenzaProps) => {
  const isMobile = useIsMobile()
  const CredenzaDescription = isMobile ? DrawerDescription : DialogDescription
  return <CredenzaDescription className={cn('break-long-words', className)} {...props} />
}

const CredenzaHeader = ({ className, ...props }: CredenzaProps) => {
  const isMobile = useIsMobile()
  const CredenzaHeader = isMobile ? DrawerHeader : DialogHeader
  return <CredenzaHeader className={className} {...props} />
}

const CredenzaTitle = ({ className, ...props }: CredenzaProps) => {
  const isMobile = useIsMobile()
  const CredenzaTitle = isMobile ? DrawerTitle : DialogTitle
  return <CredenzaTitle className={className} {...props} />
}

const CredenzaBody = ({ className, ...props }: CredenzaProps) => {
  return <div className={cn('px-4 md:px-0', className)} {...props} />
}

const CredenzaFooter = ({ withCancel, className, children, ...props }: CredenzaProps & { withCancel?: boolean }) => {
  const isMobile = useIsMobile()
  const CredenzaFooter = isMobile ? DrawerFooter : DialogFooter
  return (
    <CredenzaFooter className={cn('pb-safe-or-4 md:pb-0', className)} {...props}>
      {withCancel && !isMobile && <CredenzaCancel>Cancel</CredenzaCancel>}
      {children}
      {withCancel && isMobile && <CredenzaCancel>Cancel</CredenzaCancel>}
    </CredenzaFooter>
  )
}

export {
  Credenza,
  CredenzaBody,
  CredenzaCancel,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
}
