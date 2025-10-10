import SidebarPage from '@/components/sidebar/sidebar-page'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadQuery } from 'convex/nextjs'
import { api } from '../../../convex/_generated/api'
import DashboardContent from './_components/dashboard-content'

const DashboardPage = async () => {
  const token = await convexAuthNextjsToken()

  // Preload all necessary data for the dashboard
  const preloadedSubjects = await preloadQuery(api.subjects.getSubjectsByUser, { archived: false }, { token })
  const preloadedAssessments = await preloadQuery(api.assessments.getAssessmentsByUser, {}, { token })
  const preloadedTasks = await preloadQuery(api.tasks.getTasksForCurrentWeekKanban, {}, { token })
  const preloadedGrades = await preloadQuery(api.grades.getGradesByUser, {}, { token })

  return (
    <SidebarPage>
      <DashboardContent
        preloadedSubjects={preloadedSubjects}
        preloadedAssessments={preloadedAssessments}
        preloadedTasks={preloadedTasks}
        preloadedGrades={preloadedGrades}
      />
    </SidebarPage>
  )
}

export default DashboardPage
