import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth, requireAuthAndOwnership } from './authHelpers'
import { assessmentObject, subjectFields, subjectObject } from './schema'
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
      throw new ConvexError(validation.error!)
    }

    // Check for duplicate subject name for authenticated user
    const existingSubject = await ctx.db
      .query('subjects')
      .withIndex('by_user_and_name', (q) => q.eq('userId', userId).eq('name', args.name))
      .first()

    if (existingSubject) {
      throw new ConvexError('A subject with this name already exists')
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
    search: v.optional(v.string()),
    archived: v.optional(v.union(v.literal('unarchived'), v.literal('archived'), v.literal('all'))),
    term: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.array(subjectObject),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const archivedFilter = args.archived ?? 'unarchived'
    const hasSearch = !!args.search && args.search.trim().length > 0
    const hasTerm = args.term !== undefined && args.term !== null && String(args.term).trim().length > 0

    if (hasSearch) {
      // Use search index for name search with filter constraints
      let queryBuilder = ctx.db
        .query('subjects')
        .withSearchIndex('search_name', (q) => q.search('name', args.search!.trim()).eq('userId', userId))

      if (archivedFilter === 'unarchived') {
        queryBuilder = queryBuilder.filter((q) => q.eq(q.field('archived'), false))
      } else if (archivedFilter === 'archived') {
        queryBuilder = queryBuilder.filter((q) => q.eq(q.field('archived'), true))
      }

      if (hasTerm) {
        queryBuilder = queryBuilder.filter((q) => q.eq(q.field('term'), args.term))
      }

      return await queryBuilder.collect()
    }

    // Non-search path uses regular indexes
    if (archivedFilter === 'all') {
      let q = ctx.db
        .query('subjects')
        .withIndex('by_user', (qb) => qb.eq('userId', userId))
        .order('desc')
      if (hasTerm) {
        q = q.filter((qb) => qb.eq(qb.field('term'), args.term))
      }
      return await q.collect()
    }

    // archived/unarchived specific
    let q = ctx.db
      .query('subjects')
      .withIndex('by_user_and_archived', (qb) => qb.eq('userId', userId).eq('archived', archivedFilter === 'archived'))
      .order('desc')

    if (hasTerm) {
      q = q.filter((qb) => qb.eq(qb.field('term'), args.term))
    }

    return await q.collect()
  },
})

/**
 * Get available unique terms for the user's subjects
 */
export const getUniqueTerms = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    const rows = await ctx.db
      .query('subjects')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const terms = Array.from(new Set(rows.map((r) => r.term).filter((t): t is string => !!t)))
    terms.sort((a, b) => a.localeCompare(b))
    return terms
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
 * Subject detail with computed total grade
 */
export const getSubjectDetail = query({
  args: {
    subjectId: v.id('subjects'),
  },
  returns: v.union(
    v.object({
      subject: subjectObject,
      assessments: v.array(assessmentObject),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { data: subject } = await requireAuthAndOwnership(ctx, args.subjectId, { allowNull: true })
    if (!subject) return null

    const assessments = await ctx.db
      .query('assessments')
      .withIndex('by_subject', (q) => q.eq('subjectId', subject._id))
      .collect()

    return {
      subject,
      assessments,
    }
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
      throw new ConvexError(validation.error!)
    }

    // Check for duplicate name (excluding current subject)
    if (validation.data.name !== undefined) {
      const existingSubject = await ctx.db
        .query('subjects')
        .withIndex('by_user_and_name', (q) => q.eq('userId', subject.userId).eq('name', validation.data.name!))
        .filter((q) => q.neq(q.field('_id'), args.subjectId))
        .first()

      if (existingSubject) {
        throw new ConvexError('A subject with this name already exists')
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
      // Delete assessment
      await ctx.db.delete(assessment._id)
    }

    // Delete grades
    const grades = await ctx.db
      .query('grades')
      .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId))
      .collect()

    for (const grade of grades) {
      await ctx.db.delete(grade._id)
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
