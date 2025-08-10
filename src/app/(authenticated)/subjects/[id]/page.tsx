import SubjectDetail from '@/app/(authenticated)/subjects/[id]/subject-detail'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadedQueryResult, preloadQuery } from 'convex/nextjs'
import { notFound } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

const SubjectPage = async ({ params }: { params: Promise<{ id: Id<'subjects'> }> }) => {
  const { id } = await params
  const token = await convexAuthNextjsToken()
  const preloadedDetail = await preloadQuery(api.subjects.getSubjectDetail, { subjectId: id }, { token })
  const detail = preloadedQueryResult(preloadedDetail)

  if (!detail) {
    notFound()
  }

  return (
    <SidebarPage
      breadcrumb={[
        { title: 'Subjects', href: '/subjects' },
        { title: detail.subject.name, href: `/subjects/${detail.subject._id}` },
      ]}
    >
      <SubjectDetail preloadedDetail={preloadedDetail} />
    </SidebarPage>
  )
}

export default SubjectPage
