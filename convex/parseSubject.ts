'use node'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { ConvexError, v } from 'convex/values'
import { z } from 'zod'
import { action } from './_generated/server'
import { assessmentFields, subjectFields } from './schema'
import { VALIDATION_LIMITS } from './validation'

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
    // Get the PDF file from Convex storage
    const fileUrl = await ctx.storage.getUrl(args.fileId)
    if (!fileUrl) {
      throw new ConvexError('File not found')
    }

    // Download the file
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new ConvexError('Failed to download file')
    }

    const fileBuffer = await response.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)

    // Initialize Google Gemini model
    const model = google('gemini-2.5-flash')

    // Use AI to extract structured data from PDF
    const result = await generateObject({
      model,
      schema: extractionSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert at extracting academic subject information from university subject outlines.

Extract comprehensive information from the provided PDF document. The schema defines exactly what fields to extract and their requirements.

VALIDATION RULES:
- Use empty strings for missing optional fields
- Total assessment weights should equal 100%
- Icon selection guide:
  📝 Essays, reports, written work
  📚 Exams, tests, reading assignments
  🎤 Presentations, oral assessments
  💻 Programming, digital projects
  🎨 Creative work, design projects
  🧪 Lab work, experiments
  🌐 Online submissions, web-based
  🎭 Performance, practical demonstrations

Extract all available information while ensuring assessment weights sum to exactly 100%.`,
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
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      },
    })

    const extractedData = result.object
    console.log(extractedData)

    return {
      subject: extractedData.subject,
      assessments: extractedData.assessments,
    }
  },
})
