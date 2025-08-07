'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { themes } from '@/components/theme/mode-tabs'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

type ModeToggleProps = HTMLAttributes<HTMLButtonElement>

export const ModeToggle = ({ className, children, ...props }: ModeToggleProps) => {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('h-8 w-8', className)} {...props}>
          <SunIcon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-28">
        {themes.map((theme) => (
          <DropdownMenuItem key={theme.theme} onClick={() => setTheme(theme.theme)} className="gap-3">
            <theme.icon size={18} />
            {theme.theme.charAt(0).toUpperCase() + theme.theme.slice(1)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
