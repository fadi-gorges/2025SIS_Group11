'use client'

import { Preloaded, usePreloadedQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { api } from '../../../../../convex/_generated/api'

type SubjectDetailProps = {
  preloadedSubject: Preloaded<typeof api.subjects.getSubjectById>
  preloadedAssessments: Preloaded<typeof api.assessments.getAssessmentsByUser>
}

const SubjectDetail = ({ preloadedSubject }: SubjectDetailProps) => {
  const router = useRouter()
  const subject = usePreloadedQuery(preloadedSubject)

  useEffect(() => {
    if (!subject) {
      router.push('/subjects')
    }
  }, [subject, router])

  if (!subject) {
    return null
  }

  // This component now serves as a placeholder for any remaining interactive sections
  // that might be added in the future. Currently, all sections have been moved to
  // the server component (page.tsx) or extracted into separate components.
  return null
}

export default SubjectDetail
