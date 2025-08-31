import AssessmentList from '@/app/(authenticated)/assessments/_components/assessment-list'
import SubjectDetail from '@/app/(authenticated)/subjects/[subjectId]/_components/subject-detail'
import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { buttonVariants } from '@/components/ui/button'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadedQueryResult, preloadQuery } from 'convex/nextjs'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

const SubjectPage = async ({ params }: { params: Promise<{ subjectId: Id<'subjects'> }> }) => {
  const { subjectId } = await params
  const token = await convexAuthNextjsToken()
  const preloadedSubject = await preloadQuery(api.subjects.getSubjectById, { subjectId }, { token })
  const preloadedAssessments = await preloadQuery(api.assessments.getAssessmentsByUser, { subjectId }, { token })
  const preloadedGrades = await preloadQuery(api.grades.getGradesByUser, { subjectId }, { token })
  const subject = preloadedQueryResult(preloadedSubject)

  if (!subject) {
    notFound()
  }

  return (
    <SidebarPage breadcrumb={[{ title: 'Subjects', href: '/subjects' }, { title: subject.name }]}>
      <div className="space-y-6">
        <SubjectDetail
          preloadedSubject={preloadedSubject}
          preloadedAssessments={preloadedAssessments}
          preloadedGrades={preloadedGrades}
        />

        {/* Assessments Overview */}
        <BorderedCard>
          <BorderedCardHeader className="justify-between">
            <BorderedCardTitle>Assessments</BorderedCardTitle>
            <Link
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              href={`/assessments?subject=${subject._id}`}
            >
              View All
            </Link>
          </BorderedCardHeader>
          <BorderedCardContent className="space-y-4 p-3">
            <AssessmentList
              preloadedAssessments={preloadedAssessments}
              preloadedGrades={preloadedGrades}
              hasFilter={false}
              view="grid"
              itemsPerPage={3}
            />
          </BorderedCardContent>
        </BorderedCard>
      </div>
    </SidebarPage>
  )
}

export default SubjectPage
