import SubjectList from '@/app/(authenticated)/subjects/_components/subject-list'
import SidebarPage from '@/components/sidebar/sidebar-page'
import TopBar from './_components/top-bar'

const SubjectsPage = async () => {
  return (
    <SidebarPage breadcrumb={[{ title: 'Subjects', href: '/subjects' }]}>
      <div className="flex flex-1 flex-col gap-4">
        <TopBar />
        <SubjectList />
      </div>
    </SidebarPage>
  )
}

export default SubjectsPage
