import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { assessmentIcons, taskPriority, taskStatus, taskType } from './validation'

// =============================================================================
// REUSABLE FIELD OBJECTS
// =============================================================================

/**
 * User field definitions
 */
export const userFields = {
  givenName: v.optional(v.string()),
  familyName: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  reminderSchedule: v.optional(v.array(v.union(v.literal('one_week'), v.literal('one_day'), v.literal('on_the_day')))),
} as const

/**
 * Subject field definitions
 */
export const subjectFields = {
  name: v.string(),
  code: v.optional(v.string()),
  description: v.optional(v.string()),
  term: v.optional(v.string()),
  coordinatorName: v.optional(v.string()),
  coordinatorEmail: v.optional(v.string()),
  archived: v.boolean(),
  userId: v.id('users'),
} as const

/**
 * Assessment field definitions
 */
export const assessmentFields = {
  name: v.string(),
  icon: v.union(...assessmentIcons.map((icon) => v.literal(icon))),
  contribution: v.union(v.literal('individual'), v.literal('group')),
  weight: v.number(),
  description: v.optional(v.string()),
  dueDate: v.optional(v.number()),
  complete: v.boolean(),
  showCheckAlert: v.boolean(),
  userId: v.id('users'),
  subjectId: v.id('subjects'),
} as const

/**
 * Assessment grade field definitions
 */
export const gradeFields = {
  name: v.optional(v.string()),
  grade: v.number(),
  userId: v.id('users'),
  subjectId: v.id('subjects'),
  assessmentId: v.id('assessments'),
} as const

/**
 * Week field definitions
 */
export const weekFields = {
  name: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  isHoliday: v.boolean(),
  current: v.boolean(),
  userId: v.id('users'),
} as const

/**
 * Task field definitions
 */
export const taskFields = {
  name: v.string(),
  type: v.union(...taskType.map((type) => v.literal(type))),
  description: v.optional(v.string()),
  weekId: v.optional(v.id('weeks')),
  dueDate: v.optional(v.number()),
  status: v.union(...taskStatus.map((status) => v.literal(status))),
  priority: v.union(...taskPriority.map((priority) => v.literal(priority))),
  reminderTime: v.optional(v.number()),
  userId: v.id('users'),
  subjectId: v.optional(v.id('subjects')),
  assessmentId: v.optional(v.id('assessments')),
} as const

/**
 * Complete object schemas with system fields for use in Convex functions
 */
export const userObject = v.object({
  _id: v.id('users'),
  _creationTime: v.number(),
  ...userFields,
})

export const subjectObject = v.object({
  _id: v.id('subjects'),
  _creationTime: v.number(),
  ...subjectFields,
})

export const assessmentObject = v.object({
  _id: v.id('assessments'),
  _creationTime: v.number(),
  ...assessmentFields,
})

export const gradeObject = v.object({
  _id: v.id('grades'),
  _creationTime: v.number(),
  ...gradeFields,
})

export const weekObject = v.object({
  _id: v.id('weeks'),
  _creationTime: v.number(),
  ...weekFields,
})

export const taskObject = v.object({
  _id: v.id('tasks'),
  _creationTime: v.number(),
  ...taskFields,
})

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  // Users table - represents users
  users: defineTable(userFields),

  // Subjects table - represents academic subjects/courses
  subjects: defineTable(subjectFields)
    .index('by_user', ['userId'])
    .index('by_user_and_archived', ['userId', 'archived'])
    .index('by_name', ['name'])
    .index('by_user_and_name', ['userId', 'name'])
    .searchIndex('search_name', { searchField: 'name', filterFields: ['userId', 'archived', 'term'] }),

  // Assessments table - represents assignments, exams, projects, etc.
  assessments: defineTable(assessmentFields)
    .index('by_user', ['userId'])
    .index('by_subject', ['subjectId'])
    .index('by_user_and_subject', ['userId', 'subjectId'])
    .index('by_user_and_complete', ['userId', 'complete'])
    .index('by_due_date', ['dueDate'])
    .index('by_user_and_due_date', ['userId', 'dueDate'])
    .index('by_subject_and_complete', ['subjectId', 'complete']),

  // Assessment grades - represents grades for different criteria within an assessment
  grades: defineTable(gradeFields)
    .index('by_assessment', ['assessmentId'])
    .index('by_subject', ['subjectId'])
    .index('by_user', ['userId']),

  // Timeline weeks and holidays - represents time periods for organizing tasks
  weeks: defineTable(weekFields)
    .index('by_user', ['userId'])
    .index('by_user_and_start_date', ['userId', 'startDate'])
    .index('by_user_and_current', ['userId', 'current'])
    .index('by_start_date', ['startDate']),

  // Tasks - represents work items that can be assigned to weeks
  tasks: defineTable(taskFields)
    .index('by_user', ['userId'])
    .index('by_week', ['weekId'])
    .index('by_user_and_week', ['userId', 'weekId'])
    .index('by_user_and_status', ['userId', 'status'])
    .index('by_subject', ['subjectId'])
    .index('by_assessment', ['assessmentId'])
    .index('by_due_date', ['dueDate'])
    .searchIndex('search_name', { searchField: 'name', filterFields: ['userId'] }),
})
