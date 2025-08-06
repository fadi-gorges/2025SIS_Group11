/**
 * Validation schemas for the study planner application
 * Using Zod for type-safe validation with greatly simplified logic
 */

import { z } from 'zod'

// Validation constants
export const VALIDATION_LIMITS = {
  // Subject limits
  SUBJECT_NAME_MAX_LENGTH: 75,
  SUBJECT_CODE_MAX_LENGTH: 10,
  SUBJECT_DESCRIPTION_MAX_LENGTH: 2000,
  SUBJECT_TERM_MAX_LENGTH: 25,
  COORDINATOR_NAME_MAX_LENGTH: 100,

  // Assessment limits
  ASSESSMENT_NAME_MAX_LENGTH: 75,
  ASSESSMENT_TASK_MAX_LENGTH: 2000,
  ASSESSMENT_WEIGHT_MIN: 0,
  ASSESSMENT_WEIGHT_MAX: 100,

  // Grade limits
  GRADE_NAME_MAX_LENGTH: 75,
  GRADE_MIN: 0,
  GRADE_MAX: 100,

  // Task limits
  TASK_NAME_MAX_LENGTH: 100,
  TASK_DESCRIPTION_MAX_LENGTH: 2000,
} as const

// Valid assessment icons (from the original config)
export const VALID_ASSESSMENT_ICONS = [
  '📝', // Writing/Essay
  '📚', // Reading/Study
  '🎤', // Presentation
  '💻', // Programming/Digital
  '🎨', // Creative/Art
  '🧪', // Science/Lab
  '🌐', // Web/Online
  '🎭', // Performance/Drama
] as const

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Subject validation schemas
 */
export const subjectNameSchema = z
  .string()
  .trim()
  .min(1, 'Subject name is required')
  .max(
    VALIDATION_LIMITS.SUBJECT_NAME_MAX_LENGTH,
    `Subject name must be no more than ${VALIDATION_LIMITS.SUBJECT_NAME_MAX_LENGTH} characters`,
  )

export const subjectCodeSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.SUBJECT_CODE_MAX_LENGTH,
    `Subject code must be no more than ${VALIDATION_LIMITS.SUBJECT_CODE_MAX_LENGTH} characters`,
  )
  .optional()

export const subjectDescriptionSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.SUBJECT_DESCRIPTION_MAX_LENGTH,
    `Description must be no more than ${VALIDATION_LIMITS.SUBJECT_DESCRIPTION_MAX_LENGTH} characters`,
  )
  .optional()

export const subjectTermSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.SUBJECT_TERM_MAX_LENGTH,
    `Term must be no more than ${VALIDATION_LIMITS.SUBJECT_TERM_MAX_LENGTH} characters`,
  )
  .optional()

export const coordinatorNameSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.COORDINATOR_NAME_MAX_LENGTH,
    `Coordinator name must be no more than ${VALIDATION_LIMITS.COORDINATOR_NAME_MAX_LENGTH} characters`,
  )
  .optional()

/**
 * Assessment validation schemas
 */
export const assessmentNameSchema = z
  .string()
  .trim()
  .min(1, 'Assessment name is required')
  .max(
    VALIDATION_LIMITS.ASSESSMENT_NAME_MAX_LENGTH,
    `Assessment name must be no more than ${VALIDATION_LIMITS.ASSESSMENT_NAME_MAX_LENGTH} characters`,
  )

export const assessmentWeightSchema = z
  .number()
  .min(VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MIN, `Weight must be at least ${VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MIN}`)
  .max(
    VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX,
    `Weight must be no more than ${VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX}`,
  )

export const assessmentDescriptionSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.ASSESSMENT_TASK_MAX_LENGTH,
    `Task description must be no more than ${VALIDATION_LIMITS.ASSESSMENT_TASK_MAX_LENGTH} characters`,
  )
  .optional()

export const assessmentIconSchema = z.enum(VALID_ASSESSMENT_ICONS, {
  message: 'Invalid icon selected. Please choose from the available options.',
})

export const assessmentContributionSchema = z.enum(['individual', 'group'], {
  message: 'Invalid contribution selected. Please choose from the available options.',
})

/**
 * Grade validation schema
 */
export const gradeSchema = z
  .number()
  .min(VALIDATION_LIMITS.GRADE_MIN, `Grade must be at least ${VALIDATION_LIMITS.GRADE_MIN}`)
  .max(VALIDATION_LIMITS.GRADE_MAX, `Grade must be no more than ${VALIDATION_LIMITS.GRADE_MAX}`)

export const gradeNameSchema = z
  .string()
  .trim()
  .min(1, 'Grade name is required')
  .max(
    VALIDATION_LIMITS.GRADE_NAME_MAX_LENGTH,
    `Grade name must be no more than ${VALIDATION_LIMITS.GRADE_NAME_MAX_LENGTH} characters`,
  )

/**
 * Task validation schema
 */
export const taskNameSchema = z
  .string()
  .trim()
  .min(1, 'Task name is required')
  .max(
    VALIDATION_LIMITS.TASK_NAME_MAX_LENGTH,
    `Task name must be no more than ${VALIDATION_LIMITS.TASK_NAME_MAX_LENGTH} characters`,
  )

export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.TASK_DESCRIPTION_MAX_LENGTH,
    `Task description must be no more than ${VALIDATION_LIMITS.TASK_DESCRIPTION_MAX_LENGTH} characters`,
  )
  .optional()

export const taskStatusSchema = z.enum(['todo', 'doing', 'done'])

export const taskPrioritySchema = z.enum(['none', 'low', 'medium', 'high'])

/**
 * Email validation schema (optional)
 */
export const emailSchema = z.email('Please enter a valid email address').optional().or(z.literal(''))

/**
 * Date validation schema
 */
export const futureDateSchema = z
  .number()
  .refine((date) => date >= Date.now(), {
    message: 'Date cannot be in the past',
  })
  .optional()

export const dateSchema = z.number().optional()

// =============================================================================
// COMPOSITE SCHEMAS
// =============================================================================

/**
 * Complete subject schema
 */
export const subjectSchema = z.object({
  name: subjectNameSchema,
  code: subjectCodeSchema,
  description: subjectDescriptionSchema,
  term: subjectTermSchema,
  coordinatorName: coordinatorNameSchema,
  coordinatorEmail: emailSchema,
})

/**
 * Complete assessment schema
 */
export const assessmentSchema = z.object({
  name: assessmentNameSchema,
  icon: assessmentIconSchema,
  contribution: assessmentContributionSchema,
  weight: assessmentWeightSchema,
  description: assessmentDescriptionSchema,
  dueDate: dateSchema,
})

/**
 * Complete grade schema
 */
export const assessmentGradeSchema = z.object({
  name: gradeNameSchema,
  grade: gradeSchema,
})

/**
 * Complete assessment task schema
 */
export const assessmentTaskSchema = z.object({
  name: taskNameSchema,
  description: taskDescriptionSchema,
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  reminder: z.number().optional(),
})

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

/**
 * Generic validation function that returns the old format for backward compatibility
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { isValid: false; error?: string } | { isValid: true; data: T } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { isValid: true, data: result.data }
  } else {
    return {
      isValid: false,
      error: result.error.issues[0]?.message || 'Validation failed',
    }
  }
}

/**
 * Validate assessment weight with total weight check
 */
export function validateWeight(
  weight: number,
  existingWeights: number[] = [],
  excludeCurrentWeight: boolean = false,
): { isValid: boolean; error?: string } {
  // First validate the weight itself
  const weightResult = validateWithSchema(assessmentWeightSchema, weight)
  if (!weightResult.isValid) {
    return weightResult
  }

  // Then check total weight
  const totalExistingWeight = existingWeights.reduce((sum, w) => sum + w, 0)
  const newTotal = excludeCurrentWeight ? totalExistingWeight + weight : totalExistingWeight + weight

  if (newTotal > VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX) {
    return {
      isValid: false,
      error: `Total weight would exceed ${VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX}%. Current total: ${totalExistingWeight}%`,
    }
  }

  return { isValid: true }
}

// Export types for TypeScript
export type SubjectData = z.infer<typeof subjectSchema>
export type AssessmentData = z.infer<typeof assessmentSchema>
export type AssessmentGradeData = z.infer<typeof assessmentGradeSchema>
export type AssessmentTaskData = z.infer<typeof assessmentTaskSchema>
