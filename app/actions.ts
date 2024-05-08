'use server'

import { revalidatePath } from 'next/cache'

import { type Chat, type Message } from '@/lib/types'
import { api } from '@/trpc/server'

export async function getChats() {
  return await api.chat.list.query()
}

export async function getChat(id: string) {
  return await api.chat.detail.query({ id })
}

export async function getSharedChat(id: string) {
  return await api.chat.getShared.query({ id })
}

export async function updateChat(
  id: string,
  payload: { [key: keyof Chat]: Chat[keyof Chat] }
) {
  try {
    const chat = await api.chat.update.mutate({ id, chat: payload })

    revalidatePath('/')
    revalidatePath(`/chat/${id}`)

    return chat as Chat
  } catch (err: any) {
    return {
      error: err.message
    }
  }
}

export async function updateMessage(
  id: string,
  chatId: string,
  message: Message
) {
  try {
    const chatMessage = await api.chat.updateMessage.mutate({
      id,
      chatId,
      message
    })

    revalidatePath(`/chat/${chatId}`)

    return chatMessage
  } catch (err: any) {
    return {
      error: err.message
    }
  }
}

export async function deleteMessage(id: string, chatId: string) {
  try {
    await api.chat.deleteMessage.mutate({ id, chatId })

    revalidatePath(`/chat/${chatId}`)
  } catch (err: any) {
    return {
      error: err.message
    }
  }
}

export async function removeChat(id: string) {
  try {
    await api.chat.delete.mutate({ id })

    revalidatePath('/')
    revalidatePath(`/chat/${id}`)
  } catch (err: any) {
    return {
      error: err.message
    }
  }
}

export async function clearChats() {
  try {
    await api.chat.deleteAll.mutate()

    revalidatePath('/')
  } catch (err: any) {
    return {
      error: err.message
    }
  }
}
