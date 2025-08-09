import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError } from 'convex/values'
import { Doc, Id, TableNames } from './_generated/dataModel'
import { MutationCtx, QueryCtx } from './_generated/server'

/**
 * Get the authenticated user ID, throwing an error if not authenticated
 */
export const requireAuth = async (ctx: QueryCtx | MutationCtx): Promise<Id<'users'>> => {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new ConvexError('Unauthorized')
  }
  return userId
}

/**
 * Get the authenticated user object, throwing an error if not authenticated
 */
export const getAuthUser = async (ctx: QueryCtx | MutationCtx): Promise<Doc<'users'> | null> => {
  const userId = await getAuthUserId(ctx)
  const user = userId ? await ctx.db.get(userId) : null
  return user
}

/**
 * Get a resource and verify it belongs to the authenticated user, with optional null return for queries
 */
export const requireAuthAndOwnership = async <T extends TableNames, AllowNull extends boolean = false>(
  ctx: QueryCtx | MutationCtx,
  resourceId: Id<T>,
  options?: { allowNull?: AllowNull },
): Promise<{
  userId: Id<'users'>
  data: AllowNull extends true ? Doc<T> | null : Doc<T>
}> => {
  const userId = await requireAuth(ctx)
  const data = await ctx.db.get(resourceId)

  if (!data) {
    if (options?.allowNull) {
      return { userId, data: null } as {
        userId: Id<'users'>
        data: AllowNull extends true ? Doc<T> | null : Doc<T>
      }
    }
    throw new ConvexError('Not found')
  }

  if (data.userId !== userId) {
    throw new ConvexError('Forbidden')
  }

  return { userId, data }
}
