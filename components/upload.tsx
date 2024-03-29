'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { IconClose, IconPaperclip, IconSpinner } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'
import { type FileInfo } from '@/lib/types'
import toast from 'react-hot-toast'

export interface UploadProps {
  vision: boolean
  value: FileInfo[]
  onChange: (value: FileInfo[]) => void
}

export function Upload({ vision, value = [], onChange }: UploadProps) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [files, setFiles] = React.useState<FileInfo[]>(value)
  const [isUploadPending, startUploadTransition] = React.useTransition()
  const [isDeletePending, startDeleteTransition] = React.useTransition()

  React.useEffect(() => {
    setFiles(value)
  }, [value])

  React.useEffect(() => {
    onChange(files)
  }, [files, onChange])

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    startUploadTransition(async () => {
      const inputfiles = e.target.files
      if (inputfiles && inputfiles.length > 0) {
        const newFiles: FileInfo[] = []

        for (let i = 0; i < inputfiles.length; i++) {
          const file = inputfiles[i]
          if (!file.type.startsWith('image/')) {
            toast.error(`File '${file.name}' is not an image.`)
            continue
          }
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`File '${file.name}' exceeds 5MB limit.`)
            continue
          }
          try {
            const base64 = await readFileAsBase64(file)
            const fileName = file.name
            if (!files.some(f => f.name === fileName)) {
              newFiles.push({ name: fileName, type: file.type, data: base64 })
            }
          } catch (error) {
            toast.error(`Error reading file '${file.name}'`)
          }
        }

        if (files.length + newFiles.length > 5) {
          toast.error('Maximum number of files exceeded.')
          return
        }

        setFiles([...files, ...newFiles])
      }
    })
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to read file as base64'))
        }
      }
      reader.onerror = () => {
        reject(reader.error)
      }
      reader.readAsDataURL(file)
    })
  }

  return vision ? (
    <>
      <Tooltip content="Upload images (Max 5, 5MB)" align="center" side="top">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-md bg-accent/60"
          disabled={isUploadPending}
          onClick={() => {
            fileRef.current?.click()
          }}
        >
          {isUploadPending ? (
            <IconSpinner className="animate-spin" />
          ) : (
            <>
              <input
                multiple
                disabled={isUploadPending}
                ref={fileRef}
                tabIndex={-1}
                className="hidden"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileInputChange}
              />
              <IconPaperclip className="size-5" />
            </>
          )}
          <span className="sr-only">Upload images</span>
        </Button>
      </Tooltip>
      {files &&
        files.length > 0 &&
        files.map((file, index) => (
          <div className="relative size-8" key={index}>
            <img
              src={file.data}
              alt={file.name}
              className="size-8 overflow-hidden border rounded-md cursor-pointer"
            />
            {isDeletePending && (
              <div className="absolute inset-0 size-full bg-accent/60 rounded-md flex items-center justify-center"></div>
            )}
            <Button
              type="button"
              variant={'ghost'}
              className="size-4 bg-accent hover:bg-red-700 hover:text-white border rounded-full p-0 absolute -top-1.5 -right-1.5"
              disabled={isDeletePending}
              onClick={() => {
                startDeleteTransition(() => {
                  setFiles(files.filter(f => f.name !== file.name))
                })
              }}
            >
              <IconClose className="size-2.5" />
              <span className="sr-only">Delete file</span>
            </Button>
          </div>
        ))}
    </>
  ) : null
}
