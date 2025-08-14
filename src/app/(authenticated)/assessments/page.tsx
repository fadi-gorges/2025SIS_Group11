import TopBar from '@/components/extensions/top-bar'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import AssessmentFilterSheet from './_components/assessment-filter-sheet'
import AssessmentFormSheet from './_components/assessment-form-sheet'
import AssessmentList from './_components/assessment-list'

const AssessmentListPage = async () => {
  return (
    <SidebarPage breadcrumb={[{ title: 'Assessments', href: '/assessments' }]}>
      <div className="flex flex-1 flex-col gap-4">
        <TopBar searchName="assessments">
          <AssessmentFilterSheet />
          <AssessmentFormSheet
            button={
              <Button size="sm">
                <PlusIcon className="size-4" /> Add
              </Button>
            }
          />
        </TopBar>
        <AssessmentList />
      </div>
    </SidebarPage>
  )
}

export default AssessmentListPage
