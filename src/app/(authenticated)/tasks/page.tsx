import Heading from '@/components/page/heading'
import SidebarPage from '@/components/sidebar/sidebar-page'

const TasksPage = () => {
  return (
    <SidebarPage breadcrumb={[{ title: 'Tasks' }]}>
      <Heading title="Tasks" />
    </SidebarPage>
  )
}

export default TasksPage
