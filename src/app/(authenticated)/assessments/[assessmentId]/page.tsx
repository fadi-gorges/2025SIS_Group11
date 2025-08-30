import AssessmentGrades from '@/app/(authenticated)/assessments/[assessmentId]/_components/assessment-grades'
import AssessmentHeader from '@/app/(authenticated)/assessments/[assessmentId]/_components/assessment-header'
import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Progress } from '@/components/ui/progress'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadedQueryResult, preloadQuery } from 'convex/nextjs'
import { TargetIcon } from 'lucide-react'
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

  const averageGrade =
    detail.grades.length > 0 ? detail.grades.reduce((sum, grade) => sum + grade.grade, 0) / detail.grades.length : 0

  return (
    <SidebarPage breadcrumb={[{ title: 'Assessments', href: '/assessments' }, { title: detail.assessment.name }]}>
      <div className="space-y-6">
        {/* Header Section */}
        <AssessmentHeader preloadedDetail={preloadedDetail} />

        {/* Progress & Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Grade Overview Card */}
          <BorderedCard>
            <BorderedCardHeader className="justify-between">
              <BorderedCardTitle>Grade Overview</BorderedCardTitle>
              <span className="text-primary text-2xl font-bold">{Math.round(averageGrade)}%</span>
            </BorderedCardHeader>
            <BorderedCardContent className="space-y-4">
              <Progress value={Math.max(0, Math.min(100, averageGrade))} className="h-3" />
              <p className="text-muted-foreground text-xs">
                Average from {detail.grades.length} grade{detail.grades.length !== 1 ? 's' : ''}
              </p>
            </BorderedCardContent>
          </BorderedCard>

          {/* Weight Card */}
          <BorderedCard>
            <BorderedCardHeader className="justify-between">
              <BorderedCardTitle>Weight</BorderedCardTitle>
              <TargetIcon className="h-5 w-5" />
            </BorderedCardHeader>
            <BorderedCardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-2xl font-bold">{detail.assessment.weight}%</div>
                <div className="text-muted-foreground text-xs">of total subject grade</div>
              </div>
            </BorderedCardContent>
          </BorderedCard>
        </div>

        {/* Grades Section */}
        <AssessmentGrades preloadedDetail={preloadedDetail} />
      </div>
    </SidebarPage>
  )
}

export default AssessmentPage
