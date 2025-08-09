import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth, requireAuthAndOwnership } from './authHelpers'
import { subjectFields, subjectObject } from './schema'
import { subjectSchema, validateWithSchema } from './validation'

/**
 * Create a new subject
 */
export const createSubject = mutation({
  args: {
    name: subjectFields.name,
    code: subjectFields.code,
    description: subjectFields.description,
    term: subjectFields.term,
    coordinatorName: subjectFields.coordinatorName,
    coordinatorEmail: subjectFields.coordinatorEmail,
  },
  returns: v.id('subjects'),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Validate input using composite schema
    const validation = validateWithSchema(subjectSchema, args)

    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    // Check for duplicate subject name for authenticated user
    const existingSubject = await ctx.db
      .query('subjects')
      .withIndex('by_user_and_name', (q) => q.eq('userId', userId).eq('name', args.name))
      .first()

    if (existingSubject) {
      throw new Error('A subject with this name already exists')
    }

    return await ctx.db.insert('subjects', {
      ...validation.data,
      archived: false,
      userId: userId,
    })
  },
})

/**
 * Get all subjects for a user
 */
export const getSubjectsByUser = query({
  args: {
    includeArchived: v.optional(subjectFields.archived),
  },
  returns: v.array(subjectObject),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    if (args.includeArchived) {
      return await ctx.db
        .query('subjects')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .order('desc')
        .collect()
    } else {
      return await ctx.db
        .query('subjects')
        .withIndex('by_user_and_archived', (q) => q.eq('userId', userId).eq('archived', false))
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
  returns: v.union(subjectObject, v.null()),
  handler: async (ctx, args) => {
    const { data: subject } = await requireAuthAndOwnership(ctx, args.subjectId, { allowNull: true })
    return subject
  },
})

/**
 * Update a subject
 */
export const updateSubject = mutation({
  args: {
    subjectId: v.id('subjects'),
    name: v.optional(subjectFields.name),
    code: v.optional(subjectFields.code),
    description: v.optional(subjectFields.description),
    term: v.optional(subjectFields.term),
    coordinatorName: v.optional(subjectFields.coordinatorName),
    coordinatorEmail: v.optional(subjectFields.coordinatorEmail),
    archived: v.optional(subjectFields.archived),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { data: subject } = await requireAuthAndOwnership(ctx, args.subjectId)

    // Validate using composite schema (only validate fields that are being updated)
    const validation = validateWithSchema(subjectSchema.partial(), args)
    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    // Check for duplicate name (excluding current subject)
    if (validation.data.name !== undefined) {
      const existingSubject = await ctx.db
        .query('subjects')
        .withIndex('by_user_and_name', (q) => q.eq('userId', subject.userId).eq('name', validation.data.name!))
        .filter((q) => q.neq(q.field('_id'), args.subjectId))
        .first()

      if (existingSubject) {
        throw new Error('A subject with this name already exists')
      }
    }

    await ctx.db.patch(args.subjectId, validation.data)
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
    await requireAuthAndOwnership(ctx, args.subjectId)

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

      // Delete assessment
      await ctx.db.delete(assessment._id)
    }

    // Delete the subject
    await ctx.db.delete(args.subjectId)
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
    const { data: subject } = await requireAuthAndOwnership(ctx, args.subjectId)
    await ctx.db.patch(args.subjectId, {
      archived: !subject.archived,
    })
  },
})
