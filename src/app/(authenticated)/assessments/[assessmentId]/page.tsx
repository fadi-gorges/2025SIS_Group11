import AssessmentDetail from '@/app/(authenticated)/assessments/[assessmentId]/_components/assessment-detail'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadedQueryResult, preloadQuery } from 'convex/nextjs'
import { notFound } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

const AssessmentPage = async ({ params }: { params: Promise<{ assessmentId: Id<'assessments'> }> }) => {
  const { assessmentId } = await params
  const token = await convexAuthNextjsToken()
  const preloadedDetail = await preloadQuery(api.assessments.getAssessmentDetail, { assessmentId }, { token })
  const detail = preloadedQueryResult(preloadedDetail)

  if (!detail) {
    notFound()
  }

  return (
    <SidebarPage breadcrumb={[{ title: 'Assessments', href: '/assessments' }, { title: detail.assessment.name }]}>
      <AssessmentDetail preloadedDetail={preloadedDetail} />
    </SidebarPage>
  )
}

export default AssessmentPage
