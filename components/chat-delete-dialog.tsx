'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { type DialogProps } from '@radix-ui/react-dialog'
import { toast } from 'react-hot-toast'

import { ServerActionResult, type Chat } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { IconSpinner } from '@/components/ui/icons'

interface ChatDeleteDialogProps extends DialogProps {
  chat: Pick<Chat, 'id' | 'path'>
  removeChat: (args: { id: string; path: string }) => ServerActionResult<void>
  onDelete: () => void
}

export function ChatDeleteDialog({
  chat,
  removeChat,
  onDelete,
  ...props
}: ChatDeleteDialogProps) {
  const router = useRouter()
  const [isRemovePending, startRemoveTransition] = React.useTransition()

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your chat message and remove your data
            from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemovePending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isRemovePending}
            onClick={event => {
              event.preventDefault()
              startRemoveTransition(async () => {
                const result = await removeChat({
                  id: chat.id,
                  path: chat.path
                })

                if (result && 'error' in result) {
                  toast.error(result.error)
                  return
                }

                router.refresh()
                router.push('/')
                onDelete()
                toast.success('Chat deleted')
              })
            }}
          >
            {isRemovePending && <IconSpinner className="mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
