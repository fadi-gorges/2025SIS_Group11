import SubjectDetail from '@/app/(authenticated)/subjects/[subjectId]/subject-detail'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadedQueryResult, preloadQuery } from 'convex/nextjs'
import { notFound } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

const SubjectPage = async ({ params }: { params: Promise<{ subjectId: Id<'subjects'> }> }) => {
  const { subjectId } = await params
  const token = await convexAuthNextjsToken()
  const preloadedSubject = await preloadQuery(api.subjects.getSubjectById, { subjectId }, { token })
  const preloadedAssessments = await preloadQuery(api.assessments.getAssessmentsByUser, { subjectId }, { token })
  const subject = preloadedQueryResult(preloadedSubject)

  if (!subject) {
    notFound()
  }

  return (
    <SidebarPage breadcrumb={[{ title: 'Subjects', href: '/subjects' }, { title: subject.name }]}>
      <SubjectDetail preloadedSubject={preloadedSubject} preloadedAssessments={preloadedAssessments} />
    </SidebarPage>
  )
}

export default SubjectPage
