'use client'

import { useTheme } from 'next-themes'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabsProps } from '@radix-ui/react-tabs'
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

export const themes = [
  {
    theme: 'light',
    icon: SunIcon,
  },
  {
    theme: 'system',
    icon: MonitorIcon,
  },
  {
    theme: 'dark',
    icon: MoonIcon,
  },
]

export const ModeTabs = ({ ...props }: TabsProps) => {
  const { setTheme, theme } = useTheme()

  return (
    <Tabs defaultValue={theme} onValueChange={setTheme} {...props}>
      <TabsList className="h-11 rounded-full">
        {themes.map((tab) => (
          <TabsTrigger key={tab.theme} value={tab.theme} className="size-10 rounded-full p-0">
            <tab.icon size={18} />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
