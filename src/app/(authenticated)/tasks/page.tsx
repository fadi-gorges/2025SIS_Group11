import SidebarPage from '@/components/sidebar/sidebar-page'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadQuery } from 'convex/nextjs'
import { api } from '../../../../convex/_generated/api'
import KanbanBoard from './_components/kanban-board'

const TasksPage = async () => {
  const token = await convexAuthNextjsToken()
  const preloadedCurrentWeekData = await preloadQuery(api.tasks.getTasksForCurrentWeekKanban, {}, { token })

  return (
    <SidebarPage breadcrumb={[{ title: 'Tasks' }]}>
      <div className="flex h-full flex-1 flex-col">
        <KanbanBoard preloadedCurrentWeekData={preloadedCurrentWeekData} />
      </div>
    </SidebarPage>
  )
}

export default TasksPage
