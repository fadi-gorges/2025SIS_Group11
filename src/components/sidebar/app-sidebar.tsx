'use client'

import { LayoutDashboardIcon, NotebookPenIcon, SettingsIcon } from 'lucide-react'
import * as React from 'react'

import { NavMain } from '@/components/sidebar/nav-main'
import { NavUser } from '@/components/sidebar/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Preloaded } from 'convex/react'
import Link from 'next/link'
import { api } from '../../../convex/_generated/api'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboardIcon,
      isActive: true,
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: SettingsIcon,
      isActive: true,
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  preloadedUser: Preloaded<typeof api.users.getCurrentUser>
}

export function AppSidebar({ preloadedUser, ...props }: AppSidebarProps) {
  const { open } = useSidebar()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" className="group/logo flex items-center justify-center gap-2 pt-4">
          <NotebookPenIcon className={cn('size-5 transition', open && 'size-6')} />
          {open && <span className="font-bold group-hover/logo:underline">StudyPlanner</span>}
        </Link>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser preloadedUser={preloadedUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
