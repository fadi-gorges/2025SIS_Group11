/**
 * Validation schemas for the study planner application
 * Using Zod for type-safe validation with greatly simplified logic
 */

import validator from 'validator'
import { z } from 'zod'

// Validation constants
export const VALIDATION_LIMITS = {
  // User limits
  USER_NAME_MIN_LENGTH: 2,
  USER_NAME_MAX_LENGTH: 50,
  USER_PASSWORD_MIN_LENGTH: 8,

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
  ASSESSMENT_WEIGHT_STEP: 0.01,

  // Grade limits
  GRADE_NAME_MAX_LENGTH: 75,
  GRADE_MIN: 0,
  GRADE_MAX: 100,

  // Task limits
  TASK_NAME_MAX_LENGTH: 100,
  TASK_DESCRIPTION_MAX_LENGTH: 2000,
} as const

export const reminderSchedule = ['one_week', 'one_day', 'on_the_day'] as const

export const assessmentIcons = [
  '📝', // Writing/Essay
  '📚', // Reading/Study
  '🎤', // Presentation
  '💻', // Programming/Digital
  '🎨', // Creative/Art
  '🧪', // Science/Lab
  '🌐', // Web/Online
  '🎭', // Performance/Drama
] as const

export const taskStatus = ['todo', 'doing', 'done'] as const
export const taskPriority = ['none', 'low', 'medium', 'high'] as const

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * User validation schemas
 */
export const userNameSchema = z
  .string()
  .trim()
  .min(VALIDATION_LIMITS.USER_NAME_MIN_LENGTH, `Minimum ${VALIDATION_LIMITS.USER_NAME_MIN_LENGTH} characters`)
  .max(VALIDATION_LIMITS.USER_NAME_MAX_LENGTH, `Maximum ${VALIDATION_LIMITS.USER_NAME_MAX_LENGTH} characters`)
export const userEmailSchema = z.email('Please enter a valid email address').trim()
export const userPasswordSchema = z
  .string()
  .trim()
  .min(
    VALIDATION_LIMITS.USER_PASSWORD_MIN_LENGTH,
    `Password must be at least ${VALIDATION_LIMITS.USER_PASSWORD_MIN_LENGTH} characters long`,
  )
  .refine(validator.isStrongPassword, {
    message: `Password must be at least ${VALIDATION_LIMITS.USER_PASSWORD_MIN_LENGTH} characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character`,
  })
export const userReminderScheduleSchema = z.array(z.enum(reminderSchedule)).optional()

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
export const coordinatorEmailSchema = z.email('Please enter a valid email address').optional().or(z.literal(''))

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
  .transform((val) => +val.toFixed(2))
export const assessmentDescriptionSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.ASSESSMENT_TASK_MAX_LENGTH,
    `Task description must be no more than ${VALIDATION_LIMITS.ASSESSMENT_TASK_MAX_LENGTH} characters`,
  )
  .optional()
export const assessmentIconSchema = z.enum(assessmentIcons, {
  message: 'Invalid icon selected. Please choose from the available options.',
})
export const assessmentContributionSchema = z.enum(['individual', 'group'], {
  message: 'Invalid contribution selected. Please choose from the available options.',
})
export const assessmentDueDateSchema = z.number().optional()

/**
 * Grade validation schema
 */
export const gradeValueSchema = z
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
export const taskStatusSchema = z.enum(taskStatus)
export const taskPrioritySchema = z.enum(taskPriority)

// =============================================================================
// COMPOSITE SCHEMAS
// =============================================================================

/**
 * Complete auth schemas
 */
export const loginSchema = z.object({
  email: userEmailSchema,
  password: z.string().trim().min(1, 'Password is required'),
})

export const profileFormSchema = z.object({
  givenName: userNameSchema,
  familyName: userNameSchema,
})

export const reminderFormSchema = z.object({
  reminderSchedule: userReminderScheduleSchema,
})

export const userSchema = z.object({
  email: userEmailSchema,
  password: userPasswordSchema,
  givenName: userNameSchema,
  familyName: userNameSchema,
  reminderSchedule: userReminderScheduleSchema,
})

export const signupSchema = userSchema
  .extend({
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

/**
 * Complete subject schema
 */
export const subjectSchema = z.object({
  name: subjectNameSchema,
  code: subjectCodeSchema,
  description: subjectDescriptionSchema,
  term: subjectTermSchema,
  coordinatorName: coordinatorNameSchema,
  coordinatorEmail: coordinatorEmailSchema,
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
  dueDate: assessmentDueDateSchema,
})
export const createAssessmentSchema = assessmentSchema.extend({
  subjectId: z.string().min(1, 'Please select a subject'),
})

/**
 * Complete grade schema
 */
export const gradeSchema = z.object({
  name: gradeNameSchema,
  grade: gradeValueSchema,
})

// Export types for TypeScript
export type LoginData = z.infer<typeof loginSchema>
export type SignupData = z.infer<typeof signupSchema>
export type ProfileFormData = z.infer<typeof profileFormSchema>
export type ReminderFormData = z.infer<typeof reminderFormSchema>
export type UserData = z.infer<typeof userSchema>
export type SubjectData = z.infer<typeof subjectSchema>
export type AssessmentData = z.infer<typeof assessmentSchema>
export type CreateAssessmentData = z.infer<typeof createAssessmentSchema>
export type GradeData = z.infer<typeof gradeSchema>

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
  const newTotal = excludeCurrentWeight ? totalExistingWeight : totalExistingWeight + weight

  if (newTotal > VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX) {
    return {
      isValid: false,
      error: `Total weight would exceed ${VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX}%. Current total: ${totalExistingWeight}%`,
    }
  }

  return { isValid: true }
}
