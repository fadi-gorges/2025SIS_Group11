import TopBar from '@/components/extensions/top-bar'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Button } from '@/components/ui/button'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadQuery } from 'convex/nextjs'
import { PlusIcon } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import AssessmentFilterSheet from './_components/assessment-filter-sheet'
import AssessmentFormSheet from './_components/assessment-form-sheet'
import AssessmentList from './_components/assessment-list'

const AssessmentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { search, subject, complete: _complete } = await searchParams
  const complete = _complete ?? 'all'
  const hasFilter = !!search || !!subject || _complete !== 'all'

  const token = await convexAuthNextjsToken()
  const preloadedSubjects = await preloadQuery(api.subjects.getSubjectsByUser, { archived: false }, { token })
  const preloadedAssessments = await preloadQuery(
    api.assessments.getAssessmentsByUser,
    {
      subjectId: subject as Id<'subjects'>,
      search: search as string,
      complete: complete === 'all' ? undefined : _complete === 'complete',
    },
    { token },
  )
  const preloadedGrades = await preloadQuery(api.grades.getGradesByUser, {}, { token })

  return (
    <SidebarPage breadcrumb={[{ title: 'Assessments' }]}>
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <TopBar searchName="assessments">
          <AssessmentFilterSheet preloadedSubjects={preloadedSubjects} />
          <AssessmentFormSheet
            button={
              <Button size="sm">
                <PlusIcon className="size-4" /> Add
              </Button>
            }
          />
        </TopBar>
        <AssessmentList
          preloadedAssessments={preloadedAssessments}
          preloadedGrades={preloadedGrades}
          hasFilter={hasFilter}
        />
      </div>
    </SidebarPage>
  )
}

export default AssessmentListPage
