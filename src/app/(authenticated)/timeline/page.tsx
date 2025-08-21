import Heading from '@/components/page/heading'
import SidebarPage from '@/components/sidebar/sidebar-page'

const TimelinePage = () => {
  return (
    <SidebarPage breadcrumb={[{ title: 'Timeline' }]}>
      <Heading title="Timeline" />
    </SidebarPage>
  )
}

export default TimelinePage
