import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,

  // Subjects table - represents academic subjects/courses
  subjects: defineTable({
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    term: v.optional(v.string()),
    coordinatorName: v.optional(v.string()),
    coordinatorEmail: v.optional(v.string()),
    archived: v.boolean(),
    userId: v.id('users'),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_archived', ['userId', 'archived'])
    .index('by_name', ['name']),

  // Assessments table - represents assignments, exams, projects, etc.
  assessments: defineTable({
    name: v.string(),
    icon: v.string(),
    contribution: v.union(v.literal('individual'), v.literal('group')),
    weight: v.number(),
    task: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    complete: v.boolean(),
    showCheckAlert: v.boolean(),
    userId: v.id('users'),
    subjectId: v.id('subjects'),
  })
    .index('by_user', ['userId'])
    .index('by_subject', ['subjectId'])
    .index('by_user_and_subject', ['userId', 'subjectId'])
    .index('by_user_and_complete', ['userId', 'complete'])
    .index('by_due_date', ['dueDate'])
    .index('by_user_and_due_date', ['userId', 'dueDate']),

  // Assessment grades - represents grades for different criteria within an assessment
  assessmentGrades: defineTable({
    assessmentId: v.id('assessments'),
    name: v.string(),
    grade: v.number(),
  }).index('by_assessment', ['assessmentId']),

  // Assessment tasks - represents subtasks within an assessment
  assessmentTasks: defineTable({
    assessmentId: v.id('assessments'),
    name: v.string(),
    status: v.union(v.literal('todo'), v.literal('doing'), v.literal('done')),
    priority: v.union(v.literal('none'), v.literal('low'), v.literal('medium'), v.literal('high')),
    reminder: v.optional(v.number()),
    description: v.optional(v.string()),
  }).index('by_assessment', ['assessmentId']),
})
