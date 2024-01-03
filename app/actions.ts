'use server'

import { revalidatePath } from 'next/cache'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()
    const chats = await kv.zrange<string[]>(`user:chat:${userId}`, 0, -1, {
      rev: true
    })

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function addChat(chat: Chat) {
  await kv.hmset(`chat:${chat.id}`, chat)
  await kv.zadd(`user:chat:${chat.userId}`, {
    score: chat.createdAt,
    member: `chat:${chat.id}`
  })

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const uid = await kv.hget<string>(`chat:${id}`, 'userId')

  if (uid?.toString() !== session?.user.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  revalidatePath('/')
  revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats = await kv.zrange<string[]>(`user:chat:${session.user.id}`, 0, -1)

  if (chats.length) {
    const pipeline = kv.pipeline()

    for (const chat of chats) {
      pipeline.del(chat)
      pipeline.zrem(`user:chat:${session.user.id}`, chat)
    }

    await pipeline.exec()

    revalidatePath('/')
  }
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const sharePath = `/share/${chat.id}`
  await kv.hmset(`chat:${chat.id}`, { sharePath })

  revalidatePath('/')
  revalidatePath(chat.path)

  return { ...chat, sharePath }
}

export async function updateChat(
  id: string,
  payload: { [key: keyof Chat]: Chat[keyof Chat] }
) {
  const session = await auth()

  if (!session?.user.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  await kv.hmset(`chat:${chat.id}`, payload)

  revalidatePath('/')

  return { ...chat, ...payload }
}
