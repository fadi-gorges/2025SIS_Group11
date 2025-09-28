'use node'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { ConvexError, v } from 'convex/values'
import { z } from 'zod'
import { action } from './_generated/server'
import { assessmentFields, subjectFields } from './schema'
import { VALIDATION_LIMITS } from './validation'

/**
 * Convert Windows file path to file:// URL format
 * Converts C:\Users\... to file:///C:/Users/...
 * Handles various Windows path formats and edge cases
 */
function convertWindowsPathToFileUrl(filePath: string): string {
  // Validate input
  if (!filePath || typeof filePath !== 'string') {
    return filePath
  }
  
  // Check if it's already a file:// URL
  if (filePath.startsWith('file://')) {
    return filePath
  }
  
  // Check if it's a Windows path (starts with drive letter and colon)
  if (/^[A-Za-z]:/.test(filePath)) {
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
}

const extractionSchema = z.object({
  subject: z.object({
    name: z.string().describe('The title of the academic subject or course. Do NOT include the code.'),
    code: z.string().optional().describe('The subject code (e.g., "COMP3000", "MATH101")'),
    description: z
      .string()
      .optional()
      .describe(
        `The provided description of the subject. Must be no more than ${VALIDATION_LIMITS.SUBJECT_DESCRIPTION_MAX_LENGTH} characters.`,
      ),
    term: z.string().optional().describe('The academic term or semester ONLY (e.g., "Autumn 2024", "Spring 2025")'),
    coordinatorName: z.string().optional().describe('The full name of the subject coordinator or lecturer'),
    coordinatorEmail: z.string().optional().describe('The email address of the subject coordinator'),
  }),
  assessments: z.array(
    z.object({
      name: z.string().describe('The name or title of the assessment task'),
      weight: z.number().describe('The percentage weight of this assessment towards the final grade'),
      description: z
        .string()
        .optional()
        .describe(
          `Detailed description of the assessment requirements and criteria. Must be no more than ${VALIDATION_LIMITS.ASSESSMENT_DESCRIPTION_MAX_LENGTH} characters.`,
        ),
      dueDate: z
        .string()
        .optional()
        .describe(
          'The due date and time as an ISO string (e.g. "2025-01-01T00:00:00.000") only if EXACTLY SPECIFIED in the document. If the date is not EXACTLY SPECIFIED, return an empty string. The time should default to the end of the day (11:59:59.000) if only the date is specified.',
        ),
      contribution: z.enum(['individual', 'group']).describe('Whether this is an individual or group assessment'),
      icon: z
        .enum(['📝', '📚', '🎤', '💻', '🎨', '🧪', '🌐', '🎭'])
        .describe('An appropriate emoji icon representing the type of assessment'),
    }),
  ),
})

/**
 * Parse a PDF subject outline and extract subject and assessment information
 */
export const parseSubject = action({
  args: {
    fileId: v.id('_storage'),
  },
  returns: v.object({
    subject: v.object({
      name: subjectFields.name,
      code: subjectFields.code,
      description: subjectFields.description,
      term: subjectFields.term,
      coordinatorName: subjectFields.coordinatorName,
      coordinatorEmail: subjectFields.coordinatorEmail,
    }),
    assessments: v.array(
      v.object({
        name: assessmentFields.name,
        icon: assessmentFields.icon,
        contribution: assessmentFields.contribution,
        weight: assessmentFields.weight,
        description: assessmentFields.description,
        dueDate: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    try {
      console.log('parseSubject handler started with fileId:', args.fileId)
      
      // Get the file directly from Convex storage instead of using URL
      console.log('Getting file directly from storage...')
      let fileBytes
      try {
        const fileBlob = await ctx.storage.get(args.fileId)
        if (!fileBlob) {
          throw new ConvexError('File not found in storage')
        }
        // Convert Blob to ArrayBuffer
        const fileBuffer = await fileBlob.arrayBuffer()
        fileBytes = new Uint8Array(fileBuffer)
        console.log('File retrieved successfully from storage, size:', fileBytes.length)
      } catch (storageError) {
        console.error('Error getting file from storage:', storageError)
        throw new ConvexError(`Failed to get file from storage: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`)
      }

    // File download successful

    // Validate file content
    if (fileBytes.length === 0) {
      throw new ConvexError('Downloaded file is empty')
    }

    // Initialize Google Gemini model
    const model = google('gemini-2.5-flash')

    // Use AI to extract structured data from PDF
    let result
    try {
      result = await generateObject({
        model,
        schema: extractionSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract subject and assessment information from this PDF document. Return the data in the exact format specified by the schema.`,
              },
              {
                type: 'file',
                data: fileBytes,
                mediaType: 'application/pdf',
              },
            ],
          },
        ],
        temperature: 0.1,
      })
    } catch (aiError) {
      throw new ConvexError(`AI processing failed: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}`)
    }

    const extractedData = result.object

    return {
      subject: extractedData.subject,
      assessments: extractedData.assessments,
    }
    } catch (error) {
      console.error('parseSubject handler error:', error)
      throw new ConvexError(`parseSubject failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})
