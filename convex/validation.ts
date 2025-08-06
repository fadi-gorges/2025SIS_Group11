/**
 * Validation utilities for the study planner application
 * These functions mirror the validation logic from the old PayloadCMS implementation
 */

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

/**
 * Validate subject name
 */
export function validateSubjectName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Subject name is required' }
  }

  if (name.length > VALIDATION_LIMITS.SUBJECT_NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Subject name must be no more than ${VALIDATION_LIMITS.SUBJECT_NAME_MAX_LENGTH} characters`,
    }
  }

  return { isValid: true }
}

/**
 * Validate assessment weight
 * Includes logic to check total weight across assessments in a subject
 */
export function validateWeight(
  weight: number,
  existingWeights: number[] = [],
  excludeCurrentWeight: boolean = false,
): { isValid: boolean; error?: string } {
  if (weight < VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MIN || weight > VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX) {
    return {
      isValid: false,
      error: `Weight must be between ${VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MIN} and ${VALIDATION_LIMITS.ASSESSMENT_WEIGHT_MAX}`,
    }
  }

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

/**
 * Validate grade value
 */
export function validateGrade(grade: number): { isValid: boolean; error?: string } {
  if (grade < VALIDATION_LIMITS.GRADE_MIN || grade > VALIDATION_LIMITS.GRADE_MAX) {
    return {
      isValid: false,
      error: `Grade must be between ${VALIDATION_LIMITS.GRADE_MIN} and ${VALIDATION_LIMITS.GRADE_MAX}`,
    }
  }

  return { isValid: true }
}

/**
 * Validate assessment icon
 */
export function validateAssessmentIcon(icon: string): { isValid: boolean; error?: string } {
  if (!(VALID_ASSESSMENT_ICONS as readonly string[]).includes(icon)) {
    return {
      isValid: false,
      error: 'Invalid icon selected. Please choose from the available options.',
    }
  }

  return { isValid: true }
}

/**
 * Validate email format (basic validation)
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: true } // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    }
  }

  return { isValid: true }
}

/**
 * Validate text field with length limits
 */
export function validateTextField(
  value: string | undefined,
  fieldName: string,
  maxLength: number,
  required: boolean = false,
): { isValid: boolean; error?: string } {
  if (required && (!value || value.trim().length === 0)) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  if (value && value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${maxLength} characters`,
    }
  }

  return { isValid: true }
}

/**
 * Validate date is not in the past (optional check for due dates)
 */
export function validateFutureDate(
  date: number | undefined,
  allowPast: boolean = true,
): { isValid: boolean; error?: string } {
  if (!date) {
    return { isValid: true } // Date is optional
  }

  if (!allowPast && date < Date.now()) {
    return {
      isValid: false,
      error: 'Date cannot be in the past',
    }
  }

  return { isValid: true }
}

/**
 * Sanitize and trim string input
 */
export function sanitizeString(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

/**
 * Type for validation result
 */
export type ValidationResult = {
  isValid: boolean
  error?: string
}
