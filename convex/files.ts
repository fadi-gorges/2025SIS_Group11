import { v } from 'convex/values'
import { mutation } from './_generated/server'

/**
 * Generate an upload URL for file uploads to Convex storage
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Delete a file from Convex storage
 */
export const deleteFile = mutation({
  args: {
    fileId: v.id('_storage'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.fileId)
  },
})
