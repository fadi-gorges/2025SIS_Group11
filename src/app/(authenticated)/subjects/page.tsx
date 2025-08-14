import SubjectFilterSheet from '@/app/(authenticated)/subjects/_components/subject-filter-sheet'
import SubjectFormSheet from '@/app/(authenticated)/subjects/_components/subject-form-sheet'
import SubjectList from '@/app/(authenticated)/subjects/_components/subject-list'
import TopBar from '@/components/extensions/top-bar'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

const SubjectListPage = async () => {
  return (
    <SidebarPage breadcrumb={[{ title: 'Subjects', href: '/subjects' }]}>
      <div className="flex flex-1 flex-col gap-4">
        <TopBar searchName="subjects">
          <SubjectFilterSheet />
          <SubjectFormSheet
            button={
              <Button size="sm">
                <PlusIcon className="size-4" /> Add
              </Button>
            }
          />
        </TopBar>
        <SubjectList />
      </div>
    </SidebarPage>
  )
}

export default SubjectListPage
