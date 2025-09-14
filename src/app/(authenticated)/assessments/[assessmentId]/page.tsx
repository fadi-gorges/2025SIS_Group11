import AssessmentDetail from '@/app/(authenticated)/assessments/[assessmentId]/_components/assessment-detail'
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

  return <AssessmentDetail preloadedDetail={preloadedDetail} />
}

export default AssessmentPage
