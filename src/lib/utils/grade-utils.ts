import { Doc } from '../../../convex/_generated/dataModel'

export const getTotalGrade = (grades: Doc<'grades'>[]) => {
  return grades.reduce((sum, grade) => sum + grade.grade, 0)
}
