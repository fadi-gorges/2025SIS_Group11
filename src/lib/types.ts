import { Doc } from '../../convex/_generated/dataModel'

export type DetailAssessment = Doc<'assessments'> & {
  subject: Doc<'subjects'> | undefined
}
