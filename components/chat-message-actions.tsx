'use client'

import * as React from 'react'
import { toast } from 'react-hot-toast'

import { ServerActionResult, Message, type Chat } from '@/lib/types'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import {
  IconCheck,
  IconCopy,
  IconSpinner,
  IconEdit,
  IconTrash
} from '@/components/ui/icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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

interface ChatMessageActionsProps {
  chat: Pick<Chat, 'id' | 'messages'>
  message: Message
  setMessages?: (messages: Message[]) => void
  updateChat?: (
    id: string,
    data: { [key: keyof Chat]: Chat[keyof Chat] }
  ) => ServerActionResult<Chat>
}

export function ChatMessageActions({
  chat,
  message,
  setMessages,
  updateChat
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 3000 })
  const [content, setContent] = React.useState(message.content)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [isEditPending, startEditTransition] = React.useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeletePending, startDeleteTransition] = React.useTransition()

  React.useEffect(() => {
    setContent(message.content)
  }, [message.content])

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  return (
    <div className="flex items-center justify-end md:absolute md:right-0 md:top-0">
      <Tooltip content="Copy message">
        <Button variant="ghost" size="icon" onClick={onCopy}>
          {isCopied ? <IconCheck /> : <IconCopy />}
          <span className="sr-only">Copy message</span>
        </Button>
      </Tooltip>
      {updateChat && setMessages && (
        <>
          <Tooltip content="Edit message">
            <Button
              variant="ghost"
              size="icon"
              disabled={isEditPending}
              onClick={() => setEditDialogOpen(true)}
            >
              <IconEdit />
            </Button>
          </Tooltip>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit message</DialogTitle>
                <DialogDescription>
                  Edit chat message content.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                className="min-h-64"
                defaultValue={content}
                onChange={e => setContent(e.target.value)}
                required
              />
              <DialogFooter className="items-center">
                <Button
                  disabled={isEditPending}
                  onClick={() => {
                    startEditTransition(async () => {
                      if (!content) {
                        toast.error('Message is required')
                        return
                      }

                      const messages = chat.messages.map(m =>
                        m.id === message.id ? { ...m, content } : m
                      )

                      const result = await updateChat(chat.id, { messages })

                      if (result && 'error' in result) {
                        toast.error(result.error)
                        return
                      }

                      setMessages(messages)
                      toast.success('Message saved')
                      setEditDialogOpen(false)
                    })
                  }}
                >
                  {isEditPending ? (
                    <>
                      <IconSpinner className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Tooltip content="Delete message">
            <Button
              variant="ghost"
              size="icon"
              disabled={isDeletePending}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <IconTrash />
            </Button>
          </Tooltip>
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your message and remove your data
                  from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletePending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeletePending}
                  onClick={event => {
                    event.preventDefault()
                    startDeleteTransition(async () => {
                      const messages = chat.messages.filter(
                        m => m.id !== message.id
                      )

                      const result = await updateChat(chat.id, { messages })

                      if (result && 'error' in result) {
                        toast.error(result.error)
                        return
                      }

                      setMessages(messages)
                      toast.success('Message deleted')
                      setDeleteDialogOpen(false)
                    })
                  }}
                >
                  {isDeletePending && (
                    <IconSpinner className="mr-2 animate-spin" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
