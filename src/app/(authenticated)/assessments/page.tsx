import Heading from '@/components/page/heading'
import SidebarPage from '@/components/sidebar/sidebar-page'

const AssessmentsPage = () => {
  return (
    <SidebarPage breadcrumb={[{ title: 'Assessments', href: '/assessments' }]}>
      <Heading title="Assessments" />
    </SidebarPage>
  )
}

export default AssessmentsPage
