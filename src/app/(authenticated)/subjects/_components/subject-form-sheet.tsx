'use client'

import FileUpload from '@/components/originui/file-upload'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { type FileWithPreview } from '@/hooks/use-file-upload'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction, useMutation } from 'convex/react'
import { FileTextIcon, LoaderIcon, UploadIcon } from 'lucide-react'
import { useRouter } from 'nextjs-toploader/app'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { subjectSchema, VALIDATION_LIMITS } from '../../../../../convex/validation'

type SubjectFormSheetProps = {
  button: React.ReactNode
}

export const SubjectFormSheet = ({ button }: SubjectFormSheetProps) => {
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<FileWithPreview>()
  const router = useRouter()
  const createSubject = useMutation(api.subjects.createSubject)
  const createSubjectWithAssessments = useMutation(api.subjects.createSubjectWithAssessments)
  const parseSubject = useAction(api.parseSubject.parseSubject)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const deleteFile = useMutation(api.files.deleteFile)

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema as any),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      term: '',
      coordinatorName: '',
      coordinatorEmail: '',
    },
  })

  // Test function to debug file upload step by step
  const testFileUpload = async () => {
    if (!uploadedFile || !(uploadedFile.file instanceof File)) {
      console.log('No file selected or file is not a File object')
      return
    }

    const file = uploadedFile.file
    console.log('=== FILE UPLOAD DEBUG TEST ===')
    console.log('File object:', file)
    console.log('File properties:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      isFile: file instanceof File
    })

    try {
      console.log('Step 1: Testing generateUploadUrl...')
      const uploadUrl = await generateUploadUrl()
      console.log('Step 1 SUCCESS: Upload URL generated:', uploadUrl)

      console.log('Step 2: Testing file upload...')
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      console.log('Step 2 SUCCESS: Upload response status:', response.status)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Step 2 SUCCESS: Upload result:', result)
      
      console.log('=== FILE UPLOAD TEST COMPLETED SUCCESSFULLY ===')
    } catch (error) {
      console.error('=== FILE UPLOAD TEST FAILED ===', error)
    }
  }

  // Process PDF and automatically create subject and assessments
  const processPDF = async () => {
    if (!uploadedFile || !(uploadedFile.file instanceof File)) return

    let storageId: Id<'_storage'> | null = null

    try {
      setIsProcessing(true)
      setProcessingStage('Uploading PDF...')

      // Ensure we have a proper File object with actual content
      const file = uploadedFile.file
      
      // File validation complete
      
      // Validate that we have actual file content, not just a path
      if (file.size === 0) {
        throw new Error('File appears to be empty or invalid')
      }
      
      // Additional validation: ensure the file has a proper name and type
      if (!file.name || file.name.trim() === '') {
        throw new Error('File name is invalid')
      }
      
      if (!file.type || file.type.trim() === '') {
        throw new Error('File type is invalid')
      }

      // Upload file to Convex using standard approach
      try {
        console.log('Starting file upload...', { fileName: file.name, fileSize: file.size, fileType: file.type })
        
        // Generate upload URL
        const uploadUrl = await generateUploadUrl()
        console.log('Upload URL generated:', uploadUrl)
        
        // Upload file using fetch
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        storageId = result.storageId as Id<'_storage'>
        console.log('File upload successful:', { storageId })
      } catch (uploadError) {
        console.error('File upload failed:', uploadError)
        throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown upload error'}`)
      }
      
      setProcessingStage('Extracting information...')

      // Parse the PDF content
      if (!storageId) {
        throw new Error('Failed to get storage ID')
      }
      
      let parsed
      try {
        console.log('Starting PDF parsing...', { storageId })
        console.log('About to call parseSubject action...')
        parsed = await parseSubject({ fileId: storageId })
        console.log('PDF parsing successful:', { subjectName: parsed.subject.name, assessmentCount: parsed.assessments.length })
      } catch (parseError) {
        console.error('PDF parsing failed with detailed error:', {
          error: parseError,
          message: parseError instanceof Error ? parseError.message : 'Unknown error',
          stack: parseError instanceof Error ? parseError.stack : undefined,
          storageId
        })
        throw new Error(`PDF parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
      }
      
      setProcessingStage('Creating subject and assessments...')

      const assessments = parsed.assessments.map((assessment) => ({
        ...assessment,
        dueDate: assessment.dueDate ? new Date(assessment.dueDate).getTime() : undefined,
      }))

      // Automatically create subject with assessments
      try {
        console.log('Creating subject with assessments...', { subjectName: parsed.subject.name, assessmentCount: assessments.length })
        const createResult = await createSubjectWithAssessments({
        subject: {
          name: parsed.subject.name,
          code: parsed.subject.code || undefined,
          description: parsed.subject.description || undefined,
          term: parsed.subject.term || undefined,
          coordinatorName: parsed.subject.coordinatorName || undefined,
          coordinatorEmail: parsed.subject.coordinatorEmail || undefined,
        },
        assessments,
      })
      
      console.log('Subject creation successful:', { subjectId: createResult.subjectId })
      
      // Clean up and redirect
      setProcessingStage('Cleaning up...')
      await deleteFile({ fileId: storageId })
      form.reset()
      setUploadedFile(undefined)
      setOpen(false)
      toast.success(
        `Subject and ${assessments.length} assessment${assessments.length > 1 ? 's' : ''} have been created successfully.`,
      )
      router.push(`/subjects/${createResult.subjectId}`)
      } catch (createError) {
        console.error('Subject creation failed:', createError)
        throw new Error(`Subject creation failed: ${createError instanceof Error ? createError.message : 'Unknown creation error'}`)
      }
    } catch (e: any) {
      toast.error(e?.data || 'Failed to process PDF. Please try again or fill in manually.')
      setIsProcessing(false)
      setProcessingStage('')
      if (storageId) {
        await deleteFile({ fileId: storageId })
      }
    }
  }

  const onSubmit = async (data: z.infer<typeof subjectSchema>) => {
    try {
      // Create subject only (manual entry)
      const id = await createSubject({
        name: data.name,
        code: data.code || undefined,
        description: data.description || undefined,
        term: data.term || undefined,
        coordinatorName: data.coordinatorName || undefined,
        coordinatorEmail: data.coordinatorEmail || undefined,
      })
      form.reset()
      setUploadedFile(undefined)
      setOpen(false)
      router.push(`/subjects/${id}`)
    } catch (e: any) {
      toast.error(e?.data || 'Failed to create subject.')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when closing
      form.reset()
      setUploadedFile(undefined)
      setIsProcessing(false)
      setProcessingStage('')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{button}</SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>New Subject</SheetTitle>
          <SheetDescription>Create a subject to organize your assessments.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto p-4">
            {/* PDF Upload Section */}
            <div className="space-y-4">
              <div>
                <Label>Upload Subject Outline (PDF)</Label>
                <p className="text-muted-foreground text-sm">
                  Upload a PDF to automatically create subject and assessments
                </p>
              </div>

              <FileUpload
                title="Upload PDF"
                icon={<FileTextIcon className="size-4 opacity-60" />}
                maxSize={2 * 1024 * 1024} // 2MB
                accept=".pdf,application/pdf"
                multiple={false}
                disabled={isProcessing}
                onFilesChange={(files) => setUploadedFile(files[0])}
                fileActions={(file) =>
                  !isProcessing && (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={testFileUpload}>
                        Test Upload
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={processPDF} disabled={isProcessing}>
                        <UploadIcon className="mr-1 size-3" />
                        Create Subject
                      </Button>
                    </div>
                  )
                }
              />

              {/* Processing status */}
              {isProcessing && uploadedFile && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <LoaderIcon className="size-4 animate-spin" />
                  <span>{processingStage}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Manual Entry Fields */}
            <div className="text-muted-foreground text-sm">Create a subject manually:</div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.SUBJECT_NAME_MAX_LENGTH}
                      placeholder="e.g., Software Engineering"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.SUBJECT_CODE_MAX_LENGTH}
                      placeholder="e.g., COMP3000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.SUBJECT_TERM_MAX_LENGTH}
                      placeholder="e.g., Semester 1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coordinatorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinator Name</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={VALIDATION_LIMITS.COORDINATOR_NAME_MAX_LENGTH}
                      placeholder="e.g., Dr Jane Smith"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coordinatorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinator Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., jane.smith@example.edu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      maxLength={VALIDATION_LIMITS.SUBJECT_DESCRIPTION_MAX_LENGTH}
                      placeholder="Optional details..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="w-full flex-row justify-end">
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Create Subject
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default SubjectFormSheet
