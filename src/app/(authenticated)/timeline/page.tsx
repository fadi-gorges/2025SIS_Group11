import SidebarPage from '@/components/sidebar/sidebar-page'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadQuery } from 'convex/nextjs'
import { api } from '../../../../convex/_generated/api'
import TimelineBoard from './_components/timeline-board'

const TimelinePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const token = await convexAuthNextjsToken()

  const preloadedWeeks = await preloadQuery(api.weeks.getWeeksByUser, { includeHolidays: true }, { token })
  const preloadedTasks = await preloadQuery(api.tasks.getTasksByUser, {}, { token })
  const preloadedSubjects = await preloadQuery(api.subjects.getSubjectsByUser, {}, { token })

  return (
    <SidebarPage breadcrumb={[{ title: 'Timeline' }]}>
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <TimelineBoard
          preloadedWeeks={preloadedWeeks}
          preloadedTasks={preloadedTasks}
          preloadedSubjects={preloadedSubjects}
        />
      </div>
    </SidebarPage>
  )
}

export default TimelinePage
