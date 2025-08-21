import SubjectFilterSheet from '@/app/(authenticated)/subjects/_components/subject-filter-sheet'
import SubjectFormSheet from '@/app/(authenticated)/subjects/_components/subject-form-sheet'
import SubjectList from '@/app/(authenticated)/subjects/_components/subject-list'
import TopBar from '@/components/extensions/top-bar'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Button } from '@/components/ui/button'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadQuery } from 'convex/nextjs'
import { PlusIcon } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { search, archived: _archived, term } = await searchParams
  const archived = _archived ?? 'unarchived'
  const hasFilter = !!search || !!term || _archived !== 'unarchived'

  const token = await convexAuthNextjsToken()
  const preloadedTerms = await preloadQuery(api.subjects.getUniqueTerms, {}, { token })
  const preloadedSubjects = await preloadQuery(
    api.subjects.getSubjectsByUser,
    {
      search: search as Id<'subjects'>,
      archived: archived === 'all' ? undefined : archived === 'archived',
      term: term as string,
    },
    { token },
  )

  return (
    <SidebarPage breadcrumb={[{ title: 'Subjects' }]}>
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <TopBar searchName="subjects">
          <SubjectFilterSheet preloadedTerms={preloadedTerms} />
          <SubjectFormSheet
            button={
              <Button size="sm">
                <PlusIcon className="size-4" /> Add
              </Button>
            }
          />
        </TopBar>
        <SubjectList preloadedSubjects={preloadedSubjects} hasFilter={hasFilter} />
      </div>
    </SidebarPage>
  )
}

export default SubjectListPage
