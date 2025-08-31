import SubjectDetail from '@/app/(authenticated)/subjects/[subjectId]/_components/subject-detail'
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
  const preloadedGrades = await preloadQuery(api.grades.getGradesByUser, { subjectId }, { token })
  const subject = preloadedQueryResult(preloadedSubject)

  if (!subject) {
    notFound()
  }

  return (
    <SubjectDetail
      preloadedSubject={preloadedSubject}
      preloadedAssessments={preloadedAssessments}
      preloadedGrades={preloadedGrades}
    />
  )
}

export default SubjectPage
