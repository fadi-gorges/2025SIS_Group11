import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireAuth } from './authHelpers'
import { subjectObject, assessmentObject, taskObject, gradeObject } from './schema'

/**
 * Get comprehensive dashboard data for the authenticated user
 */
export const getDashboardData = query({
  args: {},
  returns: v.object({
    subjects: v.array(subjectObject),
    upcomingAssessments: v.array(assessmentObject),
    tasksSummary: v.object({
      totalTasks: v.number(),
      todoTasks: v.number(),
      doingTasks: v.number(),
      doneTasks: v.number(),
      overdueTasks: v.number(),
    }),
    tasksByStatus: v.object({
      todo: v.array(taskObject),
      doing: v.array(taskObject),
      done: v.array(taskObject),
    }),
    recentGrades: v.array(gradeObject),
    averageGrade: v.union(v.number(), v.null()),
  }),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    const now = Date.now()

    // Get all data in parallel for better performance
    const [subjects, assessments, tasks, grades] = await Promise.all([
      ctx.db
        .query('subjects')
        .withIndex('by_user_and_archived', (q) => q.eq('userId', userId).eq('archived', false))
        .collect(),
      ctx.db
        .query('assessments')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db
        .query('tasks')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db
        .query('grades')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
    ])

    // Process upcoming assessments (incomplete, with due dates, sorted by due date)
    const upcomingAssessments = assessments
      .filter((a) => !a.complete && a.dueDate)
      .sort((a, b) => (a.dueDate! - b.dueDate!))
      .slice(0, 5)

    // Process tasks summary
    const tasksSummary = {
      totalTasks: tasks.length,
      todoTasks: tasks.filter((t) => t.status === 'todo').length,
      doingTasks: tasks.filter((t) => t.status === 'doing').length,
      doneTasks: tasks.filter((t) => t.status === 'done').length,
      overdueTasks: tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== 'done').length,
    }

    // Process tasks by status for dashboard display
    const tasksByStatus = {
      todo: tasks.filter((t) => t.status === 'todo'),
      doing: tasks.filter((t) => t.status === 'doing'),
      done: tasks.filter((t) => t.status === 'done'),
    }

    // Process recent grades (most recent first)
    const recentGrades = grades
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5)

    // Calculate average grade
    const averageGrade = grades.length > 0 
      ? Math.round((grades.reduce((sum, g) => sum + g.grade, 0) / grades.length) * 10) / 10
      : null

    return {
      subjects,
      upcomingAssessments,
      tasksSummary,
      tasksByStatus,
      recentGrades,
      averageGrade,
    }
  },
})

/**
 * Get dashboard statistics for quick overview
 */
export const getDashboardStats = query({
  args: {},
  returns: v.object({
    activeSubjects: v.number(),
    assessmentsDue: v.number(),
    tasksCompleted: v.string(),
    averageGrade: v.union(v.string(), v.literal('—')),
  }),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    const now = Date.now()

    const [subjects, assessments, tasks, grades] = await Promise.all([
      ctx.db
        .query('subjects')
        .withIndex('by_user_and_archived', (q) => q.eq('userId', userId).eq('archived', false))
        .collect(),
      ctx.db
        .query('assessments')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db
        .query('tasks')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db
        .query('grades')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
    ])

    const upcomingAssessments = assessments.filter((a) => !a.complete && a.dueDate)
    const completedTasks = tasks.filter((t) => t.status === 'done').length
    const totalTasks = tasks.length
    const averageGrade = grades.length > 0 
      ? Math.round((grades.reduce((sum, g) => sum + g.grade, 0) / grades.length) * 10) / 10
      : null

    return {
      activeSubjects: subjects.length,
      assessmentsDue: upcomingAssessments.length,
      tasksCompleted: `${completedTasks}/${totalTasks}`,
      averageGrade: averageGrade !== null ? `${averageGrade}%` : '—',
    }
  },
})
