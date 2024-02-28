'use server'

import { revalidatePath } from 'next/cache'

import { type Chat } from '@/lib/types'
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
  const chat = await api.chat.update.mutate({ id, chat: payload })

  revalidatePath('/')
  revalidatePath(`/chat/${id}`)

  return chat as Chat
}

export async function removeChat(id: string) {
  await api.chat.delete.mutate({ id })

  revalidatePath('/')
  revalidatePath(`/chat/${id}`)
}

export async function clearChats() {
  await api.chat.deleteAll.mutate()

  revalidatePath('/')
}
