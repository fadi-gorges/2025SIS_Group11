import AssessmentList from '@/app/(authenticated)/assessments/_components/assessment-list'
import SubjectHeader from '@/app/(authenticated)/subjects/[subjectId]/_components/subject-header'
import {
  BorderedCard,
  BorderedCardContent,
  BorderedCardHeader,
  BorderedCardTitle,
} from '@/components/page/bordered-card'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { buttonVariants } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadedQueryResult, preloadQuery } from 'convex/nextjs'
import { BookOpenIcon, FileTextIcon, SettingsIcon, StickyNoteIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

const SubjectPage = async ({ params }: { params: Promise<{ subjectId: Id<'subjects'> }> }) => {
  const { subjectId } = await params
  const token = await convexAuthNextjsToken()
  const preloadedSubject = await preloadQuery(api.subjects.getSubjectById, { subjectId }, { token })
  const preloadedAssessments = await preloadQuery(api.assessments.getAssessmentsByUser, { subjectId }, { token })
  const subject = preloadedQueryResult(preloadedSubject)
  const assessments = preloadedQueryResult(preloadedAssessments)

  if (!subject) {
    notFound()
  }

  return (
    <SidebarPage breadcrumb={[{ title: 'Subjects', href: '/subjects' }, { title: subject.name }]}>
      <div className="space-y-6">
        {/* Header Section */}
        <SubjectHeader preloadedSubject={preloadedSubject} />

        {/* Progress & Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Progress Card */}
          <BorderedCard>
            <BorderedCardHeader className="justify-between">
              <BorderedCardTitle>Overall Grade</BorderedCardTitle>
            </BorderedCardHeader>
            <BorderedCardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Progress value={Math.max(0, Math.min(100, subject.totalGrade ?? 0))} className="h-3" />
                <span className="text-primary text-2xl font-bold">{Math.round(subject.totalGrade ?? 0)}%</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Based on {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
              </p>
            </BorderedCardContent>
          </BorderedCard>

          {/* Assessments Card */}
          <BorderedCard>
            <BorderedCardHeader className="justify-between">
              <BorderedCardTitle>Assessments</BorderedCardTitle>
              <FileTextIcon className="h-5 w-5" />
            </BorderedCardHeader>
            <BorderedCardContent className="space-y-4">
              <div className="text-2xl font-bold">{assessments.length}</div>
              <div className="text-muted-foreground text-xs">
                {assessments.filter((a) => a.complete).length} complete
              </div>
            </BorderedCardContent>
          </BorderedCard>
        </div>

        {/* Assessments Overview */}
        {!!assessments.length && (
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
            <BorderedCardContent className="space-y-4">
              <AssessmentList
                preloadedAssessments={preloadedAssessments}
                hasFilter={false}
                view="grid"
                itemsPerPage={3}
              />
            </BorderedCardContent>
          </BorderedCard>
        )}

        {/* Quick Access */}
        <BorderedCard>
          <BorderedCardHeader>
            <BorderedCardTitle>Quick Access</BorderedCardTitle>
          </BorderedCardHeader>
          <BorderedCardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              <button className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 text-left transition-colors">
                <BookOpenIcon className="text-muted-foreground h-6 w-6 shrink-0" />
                <div>
                  <p className="font-medium">Assessments</p>
                  <p className="text-muted-foreground text-sm">Manage all assessments</p>
                </div>
              </button>
              <button className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 text-left transition-colors">
                <StickyNoteIcon className="text-muted-foreground h-6 w-6 shrink-0" />
                <div>
                  <p className="font-medium">Notes</p>
                  <p className="text-muted-foreground text-sm">Add and organize notes</p>
                </div>
              </button>
              <button className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 text-left transition-colors">
                <SettingsIcon className="text-muted-foreground h-6 w-6 shrink-0" />
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-muted-foreground text-sm">Manage subject settings</p>
                </div>
              </button>
            </div>
          </BorderedCardContent>
        </BorderedCard>
      </div>
    </SidebarPage>
  )
}

export default SubjectPage
