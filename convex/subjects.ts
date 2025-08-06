import { v } from 'convex/values'
import { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'

// Subject validation constants
const SUBJECT_NAME_MAX_LENGTH = 75
const SUBJECT_CODE_MAX_LENGTH = 10
const SUBJECT_DESCRIPTION_MAX_LENGTH = 2000
const SUBJECT_TERM_MAX_LENGTH = 25
const COORDINATOR_NAME_MAX_LENGTH = 100

/**
 * Create a new subject
 */
export const createSubject = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    term: v.optional(v.string()),
    coordinatorName: v.optional(v.string()),
    coordinatorEmail: v.optional(v.string()),
    userId: v.id('users'),
  },
  returns: v.id('subjects'),
  handler: async (ctx, args) => {
    // Validate input lengths
    if (args.name.length === 0 || args.name.length > SUBJECT_NAME_MAX_LENGTH) {
      throw new Error(`Subject name must be between 1 and ${SUBJECT_NAME_MAX_LENGTH} characters`)
    }

    if (args.code && args.code.length > SUBJECT_CODE_MAX_LENGTH) {
      throw new Error(`Subject code must be no more than ${SUBJECT_CODE_MAX_LENGTH} characters`)
    }

    if (args.description && args.description.length > SUBJECT_DESCRIPTION_MAX_LENGTH) {
      throw new Error(`Description must be no more than ${SUBJECT_DESCRIPTION_MAX_LENGTH} characters`)
    }

    if (args.term && args.term.length > SUBJECT_TERM_MAX_LENGTH) {
      throw new Error(`Term must be no more than ${SUBJECT_TERM_MAX_LENGTH} characters`)
    }

    if (args.coordinatorName && args.coordinatorName.length > COORDINATOR_NAME_MAX_LENGTH) {
      throw new Error(`Coordinator name must be no more than ${COORDINATOR_NAME_MAX_LENGTH} characters`)
    }

    // Check if user exists
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check for duplicate subject name for this user
    const existingSubject = await ctx.db
      .query('subjects')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('name'), args.name))
      .first()

    if (existingSubject) {
      throw new Error('A subject with this name already exists')
    }

    return await ctx.db.insert('subjects', {
      name: args.name.trim(),
      code: args.code?.trim(),
      description: args.description?.trim(),
      term: args.term?.trim(),
      coordinatorName: args.coordinatorName?.trim(),
      coordinatorEmail: args.coordinatorEmail?.trim(),
      archived: false,
      userId: args.userId,
    })
  },
})

/**
 * Get all subjects for a user
 */
export const getSubjectsByUser = query({
  args: {
    userId: v.id('users'),
    includeArchived: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id('subjects'),
      _creationTime: v.number(),
      name: v.string(),
      code: v.optional(v.string()),
      description: v.optional(v.string()),
      term: v.optional(v.string()),
      coordinatorName: v.optional(v.string()),
      coordinatorEmail: v.optional(v.string()),
      archived: v.boolean(),
      userId: v.id('users'),
    }),
  ),
  handler: async (ctx, args) => {
    const includeArchived = args.includeArchived ?? false

    if (includeArchived) {
      return await ctx.db
        .query('subjects')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .order('desc')
        .collect()
    } else {
      return await ctx.db
        .query('subjects')
        .withIndex('by_user_and_archived', (q) => q.eq('userId', args.userId).eq('archived', false))
        .order('desc')
        .collect()
    }
  },
})

/**
 * Get a single subject by ID
 */
export const getSubjectById = query({
  args: {
    subjectId: v.id('subjects'),
  },
  returns: v.union(
    v.object({
      _id: v.id('subjects'),
      _creationTime: v.number(),
      name: v.string(),
      code: v.optional(v.string()),
      description: v.optional(v.string()),
      term: v.optional(v.string()),
      coordinatorName: v.optional(v.string()),
      coordinatorEmail: v.optional(v.string()),
      archived: v.boolean(),
      userId: v.id('users'),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subjectId)
  },
})

/**
 * Update a subject
 */
export const updateSubject = mutation({
  args: {
    subjectId: v.id('subjects'),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    term: v.optional(v.string()),
    coordinatorName: v.optional(v.string()),
    coordinatorEmail: v.optional(v.string()),
    archived: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId)
    if (!subject) {
      throw new Error('Subject not found')
    }

    const updateData: Partial<Doc<'subjects'>> = {}

    // Validate and update fields
    if (args.name !== undefined) {
      if (args.name.length === 0 || args.name.length > SUBJECT_NAME_MAX_LENGTH) {
        throw new Error(`Subject name must be between 1 and ${SUBJECT_NAME_MAX_LENGTH} characters`)
      }

      // Check for duplicate name (excluding current subject)
      const existingSubject = await ctx.db
        .query('subjects')
        .withIndex('by_user', (q) => q.eq('userId', subject.userId))
        .filter((q) => q.and(q.eq(q.field('name'), args.name), q.neq(q.field('_id'), args.subjectId)))
        .first()

      if (existingSubject) {
        throw new Error('A subject with this name already exists')
      }

      updateData.name = args.name.trim()
    }

    if (args.code !== undefined) {
      if (args.code.length > SUBJECT_CODE_MAX_LENGTH) {
        throw new Error(`Subject code must be no more than ${SUBJECT_CODE_MAX_LENGTH} characters`)
      }
      updateData.code = args.code.trim() || undefined
    }

    if (args.description !== undefined) {
      if (args.description.length > SUBJECT_DESCRIPTION_MAX_LENGTH) {
        throw new Error(`Description must be no more than ${SUBJECT_DESCRIPTION_MAX_LENGTH} characters`)
      }
      updateData.description = args.description.trim() || undefined
    }

    if (args.term !== undefined) {
      if (args.term.length > SUBJECT_TERM_MAX_LENGTH) {
        throw new Error(`Term must be no more than ${SUBJECT_TERM_MAX_LENGTH} characters`)
      }
      updateData.term = args.term.trim() || undefined
    }

    if (args.coordinatorName !== undefined) {
      if (args.coordinatorName.length > COORDINATOR_NAME_MAX_LENGTH) {
        throw new Error(`Coordinator name must be no more than ${COORDINATOR_NAME_MAX_LENGTH} characters`)
      }
      updateData.coordinatorName = args.coordinatorName.trim() || undefined
    }

    if (args.coordinatorEmail !== undefined) {
      updateData.coordinatorEmail = args.coordinatorEmail.trim() || undefined
    }

    if (args.archived !== undefined) {
      updateData.archived = args.archived
    }

    await ctx.db.patch(args.subjectId, updateData)
    return null
  },
})

/**
 * Delete a subject and all related assessments
 */
export const deleteSubject = mutation({
  args: {
    subjectId: v.id('subjects'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId)
    if (!subject) {
      throw new Error('Subject not found')
    }

    // Delete all assessments for this subject
    const assessments = await ctx.db
      .query('assessments')
      .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId))
      .collect()

    for (const assessment of assessments) {
      // Delete assessment grades
      const grades = await ctx.db
        .query('assessmentGrades')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', assessment._id))
        .collect()

      for (const grade of grades) {
        await ctx.db.delete(grade._id)
      }

      // Delete assessment tasks
      const tasks = await ctx.db
        .query('assessmentTasks')
        .withIndex('by_assessment', (q) => q.eq('assessmentId', assessment._id))
        .collect()

      for (const task of tasks) {
        await ctx.db.delete(task._id)
      }

      // Delete assessment
      await ctx.db.delete(assessment._id)
    }

    // Delete the subject
    await ctx.db.delete(args.subjectId)
    return null
  },
})

/**
 * Archive/unarchive a subject
 */
export const toggleSubjectArchive = mutation({
  args: {
    subjectId: v.id('subjects'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId)
    if (!subject) {
      throw new Error('Subject not found')
    }

    await ctx.db.patch(args.subjectId, {
      archived: !subject.archived,
    })
    return null
  },
})
