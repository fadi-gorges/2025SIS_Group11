import { v } from 'convex/values'
import { mutation, query, action } from './_generated/server'

/**
 * Convert Windows file path to file:// URL format
 * Converts C:\Users\... to file:///C:/Users/...
 * Handles various Windows path formats and edge cases
 */
function convertWindowsPathToFileUrl(filePath: string): string {
  try {
    // Validate input
    if (!filePath || typeof filePath !== 'string') {
      return filePath
    }
    
    // Check if it's already a file:// URL
    if (filePath.startsWith('file://')) {
      return filePath
    }
    
    // Check if it's a Windows path (starts with drive letter)
    if (/^[A-Za-z]:\\/.test(filePath)) {
      // Convert backslashes to forward slashes and add file:// prefix
      const normalizedPath = filePath.replace(/\\/g, '/')
      return `file:///${normalizedPath}`
    }
    
    // Check for UNC paths (\\server\share\path)
    if (filePath.startsWith('\\\\')) {
      const normalizedPath = filePath.replace(/\\/g, '/')
      return `file://${normalizedPath}`
    }
    
    // For other paths, assume they're already in the correct format
    return filePath
  } catch (error) {
    // If conversion fails, return the original path
    return filePath
  }
}

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
 * Upload a file with Windows path handling
 */
export const uploadFile = action({
  args: {
    file: v.any(), // File object
  },
  returns: v.id('_storage'),
  handler: async (ctx, args) => {
    // Store the file in Convex storage
    const storageId = await ctx.storage.store(args.file)
    return storageId
  },
})

/**
 * Get a file URL with Windows path conversion
 */
export const getFileUrl = query({
  args: {
    fileId: v.id('_storage'),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const fileUrl = await ctx.storage.getUrl(args.fileId)
    if (!fileUrl) {
      throw new Error('File not found')
    }
    
    // Convert Windows path to file:// URL format if needed
    return convertWindowsPathToFileUrl(fileUrl)
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
