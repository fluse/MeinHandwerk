import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import { compressImage, dataUrlToBlob } from '@/core/lib/image'
import type { Category, Post } from '../types/post'

function toPost(r: RecordModel): Post {
  return {
    id: r.id,
    author: r.author,
    text: r.text ?? '',
    category: r.category,
    imageUrl: r.image ? pb.files.getURL(r, r.image) : '',
    pinned: !!r.pinned,
    resolved: !!r.resolved,
    likes: r.likes ?? [],
    created: r.created,
  }
}

export async function listPosts(): Promise<Post[]> {
  const records = await pb.collection('feed_posts').getFullList({ sort: '-created' })
  return records.map(toPost)
}

interface CreatePostInput {
  authorId: string
  text: string
  category: Category
  file?: File
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const formData = new FormData()
  formData.append('author', input.authorId)
  formData.append('text', input.text)
  formData.append('category', input.category)
  formData.append('pinned', 'false')
  formData.append('resolved', 'false')
  if (input.file) {
    const compressed = await compressImage(input.file, 900, 0.5)
    const blob = await dataUrlToBlob(compressed)
    formData.append('image', blob, input.file.name)
  }
  const record = await pb.collection('feed_posts').create(formData)
  return toPost(record)
}

export async function deletePost(id: string): Promise<void> {
  await pb.collection('feed_posts').delete(id)
}

export async function setLikes(id: string, likes: string[]): Promise<Post> {
  const record = await pb.collection('feed_posts').update(id, { likes })
  return toPost(record)
}

export async function setPinned(id: string, pinned: boolean): Promise<Post> {
  const record = await pb.collection('feed_posts').update(id, { pinned })
  return toPost(record)
}

export async function setResolved(id: string, resolved: boolean): Promise<Post> {
  const record = await pb.collection('feed_posts').update(id, { resolved })
  return toPost(record)
}
