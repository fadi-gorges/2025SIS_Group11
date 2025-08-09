import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthUser, requireAuth } from './authHelpers'
import { userFields, userObject } from './schema'
import { userSchema, validateWithSchema } from './validation'

/**
 * Get the current logged in user identity
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(v.null(), userObject),
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    return user
  },
})

/**
 * Update user details
 */
export const updateUser = mutation({
  args: {
    givenName: v.optional(userFields.givenName),
    familyName: v.optional(userFields.familyName),
    reminderSchedule: v.optional(userFields.reminderSchedule),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const validation = validateWithSchema(userSchema.partial(), args)
    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    await ctx.db.patch(userId, validation.data)
  },
})

/**
 * Delete a user and all related data including auth tables
 */
export const deleteUser = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Delete all subjects and their related data
    const subjects = await ctx.db
      .query('subjects')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    for (const subject of subjects) {
      // Delete all assessments for this subject
      const assessments = await ctx.db
        .query('assessments')
        .withIndex('by_subject', (q) => q.eq('subjectId', subject._id))
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
      await ctx.db.delete(subject._id)
    }

    // Delete auth-related data
    // Delete auth sessions
    const authSessions = await ctx.db
      .query('authSessions')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .collect()

    for (const session of authSessions) {
      // Delete refresh tokens for this session
      const refreshTokens = await ctx.db
        .query('authRefreshTokens')
        .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
        .collect()

      for (const token of refreshTokens) {
        await ctx.db.delete(token._id)
      }

      await ctx.db.delete(session._id)
    }

    // Delete auth accounts
    const authAccounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', userId))
      .collect()

    for (const account of authAccounts) {
      // Delete verification codes for this account
      const verificationCodes = await ctx.db
        .query('authVerificationCodes')
        .withIndex('accountId', (q) => q.eq('accountId', account._id))
        .collect()

      for (const code of verificationCodes) {
        await ctx.db.delete(code._id)
      }

      await ctx.db.delete(account._id)
    }

    // Delete the user
    await ctx.db.delete(userId)
  },
})
