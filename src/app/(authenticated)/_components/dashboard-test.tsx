'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

/**
 * Test component to demonstrate real-time updates
 * This shows how the dashboard will automatically update when data changes
 */
export const DashboardTest = () => {
  const [isCreating, setIsCreating] = useState(false)
  
  // Real-time queries that will automatically update the dashboard
  const subjects = useQuery(api.subjects.getSubjectsByUser, { archived: false })
  const assessments = useQuery(api.assessments.getAssessmentsByUser, {})
  const tasks = useQuery(api.tasks.getTasksByUser, {})
  const dashboardData = useQuery(api.dashboard.getDashboardData, {})
  
  // Mutations to test real-time updates
  const createSubject = useMutation(api.subjects.createSubject)
  const createAssessment = useMutation(api.assessments.createAssessment)
  const createTask = useMutation(api.tasks.createTask)
  const deleteSubject = useMutation(api.subjects.deleteSubject)
  
  const handleCreateTestData = async () => {
    if (isCreating) return
    setIsCreating(true)
    
    try {
      // Create a test subject
      const subjectId = await createSubject({
        name: `Test Subject ${Date.now()}`,
        code: `TEST${Math.floor(Math.random() * 1000)}`,
        term: 'T2',
        coordinatorName: 'Test Coordinator',
      })
      
      // Create a test assessment
      const assessmentId = await createAssessment({
        name: `Test Assessment ${Date.now()}`,
        icon: '🧪',
        contribution: 'individual',
        weight: 25,
        description: 'Test assessment for real-time updates',
        dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        subjectId,
      })
      
      // Create a test task
      await createTask({
        name: `Test Task ${Date.now()}`,
        description: 'Test task for real-time updates',
        status: 'todo',
        priority: 'medium',
        subjectId,
        assessmentId,
      })
      
      console.log('Test data created successfully!')
    } catch (error) {
      console.error('Error creating test data:', error)
    } finally {
      setIsCreating(false)
    }
  }
  
  const handleCleanupTestData = async () => {
    if (!subjects) return
    
    // Delete test subjects (this will cascade delete assessments and tasks)
    const testSubjects = subjects.filter(s => s.name.startsWith('Test Subject'))
    for (const subject of testSubjects) {
      try {
        await deleteSubject({ subjectId: subject._id })
      } catch (error) {
        console.error('Error deleting test subject:', error)
      }
    }
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Real-Time Dashboard Test</span>
          <Badge variant="outline">Live Updates</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Subjects:</strong> {subjects?.length || 0}
          </div>
          <div>
            <strong>Assessments:</strong> {assessments?.length || 0}
          </div>
          <div>
            <strong>Tasks:</strong> {tasks?.length || 0}
          </div>
          <div>
            <strong>Dashboard Data:</strong> {dashboardData ? 'Loaded' : 'Loading...'}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleCreateTestData} 
            disabled={isCreating}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Test Data'}
          </Button>
          
          <Button 
            onClick={handleCleanupTestData}
            variant="outline"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Test Data
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>• Click "Create Test Data" to add sample data</p>
          <p>• Watch the dashboard update automatically in real-time</p>
          <p>• Navigate to other pages and come back to see the updates</p>
          <p>• Use "Cleanup Test Data" to remove test data</p>
        </div>
      </CardContent>
    </Card>
  )
}
