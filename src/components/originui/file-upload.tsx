'use client'

import { AlertCircleIcon, PaperclipIcon, UploadIcon, XIcon } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { formatBytes, useFileUpload, type FileUploadOptions, type FileWithPreview } from '@/hooks/use-file-upload'
import { cn } from '@/lib/utils'

type FileUploadProps = React.ComponentProps<typeof Button> &
  Omit<FileUploadOptions, 'onFilesChange'> & {
    title?: string
    description?: string
    icon?: React.ReactNode
    fileActions?: (file: FileWithPreview) => React.ReactNode
    onFilesChange?: (files: FileWithPreview[]) => void
  }

export default function FileUpload({
  className,
  title = 'Upload file',
  description,
  icon,
  disabled,
  fileActions,
  onFilesChange,
  maxSize = 2 * 1024 * 1024, // 2MB default
  ...fileUploadOptions
}: FileUploadProps) {
  const [
    { files, isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps },
  ] = useFileUpload({
    maxSize,
    onFilesChange,
    ...fileUploadOptions,
  })

  const file = files[0]
  const isDisabled = disabled || Boolean(file && !fileUploadOptions.multiple)
  const defaultDescription = description || `Drag & drop or click to browse (max. ${formatBytes(maxSize)})`
  const defaultIcon = icon || <UploadIcon className="size-4 opacity-60" />

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        role="button"
        onClick={isDisabled ? undefined : openFileDialog}
        onDragEnter={isDisabled ? undefined : handleDragEnter}
        onDragLeave={isDisabled ? undefined : handleDragLeave}
        onDragOver={isDisabled ? undefined : handleDragOver}
        onDrop={isDisabled ? undefined : handleDrop}
        data-dragging={isDragging || undefined}
        className={cn(
          'border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]',
          className,
          isDisabled && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} className="sr-only" aria-label="Upload file" disabled={isDisabled} />

        <div className="flex flex-col items-center justify-center text-center">
          <div
            className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            {defaultIcon}
          </div>
          <p className="mb-1.5 text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{defaultDescription}</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="text-destructive flex items-center gap-1 text-xs" role="alert">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <PaperclipIcon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{file.file.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {fileActions && fileActions(file)}
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="text-muted-foreground/80 hover:text-foreground size-8 hover:bg-transparent"
                  onClick={() => removeFile(file.id)}
                  disabled={disabled}
                  aria-label="Remove file"
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
