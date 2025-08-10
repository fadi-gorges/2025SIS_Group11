import { ModeToggle } from '@/components/theme/mode-toggle'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { HomeIcon } from 'lucide-react'
import Link from 'next/link'

type SidebarPageProps = {
  children: React.ReactNode
  breadcrumb?: {
    title: string
    href: string
  }[]
}

const BreadcrumbSegment = ({ item, last }: { item: { title: string; href: string }; last: boolean }) => {
  return !last ? (
    <>
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link href={item.href}>{item.title}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
    </>
  ) : (
    <BreadcrumbItem>
      <BreadcrumbPage>{item.title}</BreadcrumbPage>
    </BreadcrumbItem>
  )
}

const SidebarPage = ({ children, breadcrumb }: SidebarPageProps) => {
  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          {breadcrumb && (
            <>
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <BreadcrumbItem className="text-muted-foreground hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/">
                    <HomeIcon className="size-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumb.map((item, index) => (
                    <BreadcrumbSegment key={index} item={item} last={index === breadcrumb.length - 1} />
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </>
          )}
          <ModeToggle className="ml-auto" />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">{children}</div>
    </>
  )
}

export default SidebarPage
