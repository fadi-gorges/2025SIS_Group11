# Study Planner Convex Backend

This directory contains the Convex backend implementation for the Study Planner application, converted from the original PayloadCMS configuration.

## Schema Overview

The database schema consists of four main tables:

### 1. Subjects (`subjects`)

Represents academic subjects/courses that users are enrolled in.

**Fields:**

- `name` (string, required) - Subject name (max 75 chars)
- `code` (string, optional) - Subject code (max 10 chars)
- `description` (string, optional) - Subject description (max 2000 chars)
- `term` (string, optional) - Academic term (max 25 chars)
- `coordinatorName` (string, optional) - Course coordinator name (max 100 chars)
- `coordinatorEmail` (string, optional) - Course coordinator email
- `archived` (boolean) - Whether the subject is archived
- `userId` (Id<"users">) - Reference to the user who owns this subject

**Indexes:**

- `by_user` - Query subjects by user
- `by_user_and_archived` - Query active/archived subjects by user
- `by_name` - Query subjects by name

### 2. Assessments (`assessments`)

Represents assignments, exams, projects, and other assessments within subjects.

**Fields:**

- `name` (string, required) - Assessment name (max 75 chars)
- `icon` (string, required) - Assessment icon (one of 📝📚🎤💻🎨🧪🌐🎭)
- `contribution` ("individual" | "group") - Type of assessment
- `weight` (number, required) - Assessment weight percentage (0-100)
- `task` (string, optional) - Task description (max 2000 chars)
- `dueDate` (number, optional) - Due date timestamp
- `complete` (boolean) - Whether assessment is completed
- `showCheckAlert` (boolean) - Whether to show completion alerts
- `userId` (Id<"users">) - Reference to the user
- `subjectId` (Id<"subjects">) - Reference to the subject

**Indexes:**

- `by_user` - Query assessments by user
- `by_subject` - Query assessments by subject
- `by_user_and_subject` - Query assessments by user and subject
- `by_user_and_complete` - Query completed/incomplete assessments by user
- `by_due_date` - Query assessments by due date
- `by_user_and_due_date` - Query assessments by user and due date

### 3. Assessment Grades (`assessmentGrades`)

Represents individual grades/criteria within an assessment.

**Fields:**

- `assessmentId` (Id<"assessments">) - Reference to the assessment
- `name` (string, required) - Grade criteria name (max 75 chars)
- `grade` (number, required) - Grade value (0-100)

**Indexes:**

- `by_assessment` - Query grades by assessment

### 4. Assessment Tasks (`assessmentTasks`)

Represents subtasks/todo items within an assessment.

**Fields:**

- `assessmentId` (Id<"assessments">) - Reference to the assessment
- `name` (string, required) - Task name (max 100 chars)
- `status` ("todo" | "doing" | "done") - Task status
- `priority` ("none" | "low" | "medium" | "high") - Task priority
- `reminder` (number, optional) - Reminder timestamp
- `description` (string, optional) - Task description (max 2000 chars)

**Indexes:**

- `by_assessment` - Query tasks by assessment

## API Functions

### Subjects (`subjects.ts`)

#### Mutations

- `createSubject` - Create a new subject
- `updateSubject` - Update an existing subject
- `deleteSubject` - Delete a subject and all related assessments
- `toggleSubjectArchive` - Archive/unarchive a subject

#### Queries

- `getSubjectsByUser` - Get all subjects for a user
- `getSubjectById` - Get a single subject by ID

### Assessments (`assessments.ts`)

#### Mutations

- `createAssessment` - Create a new assessment
- `updateAssessment` - Update an existing assessment
- `deleteAssessment` - Delete an assessment and related data
- `toggleAssessmentComplete` - Toggle assessment completion status

#### Queries

- `getAssessmentsByUser` - Get all assessments for a user
- `getAssessmentsBySubject` - Get assessments for a specific subject
- `getUpcomingAssessments` - Get assessments due within a time range
- `getAssessmentById` - Get a single assessment by ID

### Assessment Grades (`assessmentGrades.ts`)

#### Mutations

- `addGrade` - Add a grade to an assessment
- `updateGrade` - Update an existing grade
- `deleteGrade` - Delete a grade

#### Queries

- `getGradesByAssessment` - Get all grades for an assessment
- `getAverageGrade` - Calculate average grade for an assessment

### Assessment Tasks (`assessmentTasks.ts`)

#### Mutations

- `addTask` - Add a task to an assessment
- `updateTask` - Update an existing task
- `deleteTask` - Delete a task
- `updateTaskStatus` - Update just the status of a task

#### Queries

- `getTasksByAssessment` - Get all tasks for an assessment
- `getTasksByUserAndStatus` - Get tasks by user and optionally filter by status
- `getUpcomingTaskReminders` - Get tasks with upcoming reminders

## Validation

The `validation.ts` file contains centralized validation logic that mirrors the original PayloadCMS validation:

- Field length validation
- Assessment weight validation (ensures total doesn't exceed 100%)
- Grade validation (0-100 range)
- Email format validation
- Icon validation
- Date validation

## Usage Examples

### Creating a Subject

```typescript
import { api } from '../convex/_generated/api'

const subjectId = await convex.mutation(api.subjects.createSubject, {
  name: 'Advanced React Development',
  code: 'COMP3001',
  description: 'Advanced concepts in React development including hooks, context, and performance optimization',
  term: 'Semester 1, 2024',
  coordinatorName: 'Dr. Jane Smith',
  coordinatorEmail: 'jane.smith@university.edu',
  userId: currentUser._id,
})
```

### Creating an Assessment

```typescript
import { api } from '../convex/_generated/api'

const assessmentId = await convex.mutation(api.assessments.createAssessment, {
  name: 'Final Project',
  icon: '💻',
  contribution: 'individual',
  weight: 40,
  task: 'Build a full-stack React application with authentication and real-time features',
  dueDate: new Date('2024-06-15').getTime(),
  userId: currentUser._id,
  subjectId: subjectId,
})
```

### Adding Tasks to an Assessment

```typescript
import { api } from '../convex/_generated/api'

await convex.mutation(api.assessmentTasks.addTask, {
  assessmentId: assessmentId,
  name: 'Set up project structure',
  status: 'todo',
  priority: 'high',
  description: 'Initialize React app with TypeScript and set up basic routing',
})

await convex.mutation(api.assessmentTasks.addTask, {
  assessmentId: assessmentId,
  name: 'Implement authentication',
  status: 'todo',
  priority: 'medium',
  reminder: new Date('2024-05-15').getTime(),
})
```

### Querying Data

```typescript
import { api } from '../convex/_generated/api'

// Get all active subjects for current user
const subjects = await convex.query(api.subjects.getSubjectsByUser, {
  userId: currentUser._id,
  includeArchived: false,
})

// Get upcoming assessments
const upcomingAssessments = await convex.query(api.assessments.getUpcomingAssessments, {
  userId: currentUser._id,
  daysAhead: 14, // Next 2 weeks
})

// Get tasks in progress
const activeTasks = await convex.query(api.assessmentTasks.getTasksByUserAndStatus, {
  userId: currentUser._id,
  status: 'doing',
})
```

## Migration Notes

This Convex implementation preserves the core functionality of the original PayloadCMS configuration while adapting to Convex's patterns:

1. **Relationships**: PayloadCMS relationships are converted to Convex ID references
2. **Hooks**: PayloadCMS hooks are replaced with validation functions
3. **Access Control**: PayloadCMS access control is handled at the application level (you'll need to implement user authentication)
4. **Arrays**: PayloadCMS array fields are converted to separate tables with foreign keys
5. **Timestamps**: Convex automatically handles `_creationTime`, eliminating the need for manual timestamp management

## Authentication

This implementation assumes you're using Convex Auth (as evidenced by the `authTables` import in the schema). You'll need to:

1. Set up Convex Auth in your application
2. Implement user authentication flows
3. Add user context to function calls
4. Implement proper access control based on user ownership

## Next Steps

1. Implement user authentication using Convex Auth
2. Create frontend components that interact with these Convex functions
3. Add search functionality using Convex's full-text search capabilities
4. Implement real-time updates for collaborative features
5. Add file upload capabilities for assessment submissions using Convex File Storage
