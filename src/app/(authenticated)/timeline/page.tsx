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
  const params = await searchParams
  const token = await convexAuthNextjsToken()

  const preloadedWeeks = await preloadQuery(api.weeks.getWeeksByUser, { includeHolidays: true }, { token })
  const preloadedSubjects = await preloadQuery(api.subjects.getSubjectsByUser, { archived: false }, { token })
  const preloadedAssessments = await preloadQuery(api.assessments.getAssessmentsByUser, {}, { token })

  return (
    <SidebarPage breadcrumb={[{ title: 'Timeline' }]}>
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <TimelineBoard
          params={params}
          preloadedWeeks={preloadedWeeks}
          preloadedSubjects={preloadedSubjects}
          preloadedAssessments={preloadedAssessments}
        />
      </div>
    </SidebarPage>
  )
}

export default TimelinePage
