'use client'

import {
  BookOpenIcon,
  CalendarIcon,
  FileTextIcon,
  KanbanSquareIcon,
  LayoutDashboardIcon,
  NotebookPenIcon,
  Rows3Icon,
  SettingsIcon,
} from 'lucide-react'
import * as React from 'react'

import { NavMain } from '@/components/sidebar/nav-main'
import { NavUser } from '@/components/sidebar/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Calendar',
      url: '/calendar',
      icon: CalendarIcon,
    },
    {
      title: 'Subjects',
      url: '/subjects',
      icon: BookOpenIcon,
    },
    {
      title: 'Assessments',
      url: '/assessments',
      icon: FileTextIcon,
    },
    {
      title: 'Timeline',
      url: '/timeline',
      icon: Rows3Icon,
    },
    {
      title: 'Tasks',
      url: '/tasks',
      icon: KanbanSquareIcon,
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: SettingsIcon,
    },
  ],
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
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
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
