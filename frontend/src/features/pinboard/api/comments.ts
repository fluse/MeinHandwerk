import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { Comment } from '../types/post'

function toComment(r: RecordModel): Comment {
  return {
    id: r.id,
    post: r.post,
    author: r.author,
    text: r.text,
    created: r.created,
  }
}

export async function listComments(postId: string): Promise<Comment[]> {
  const records = await pb.collection('feed_comments').getFullList({
    filter: pb.filter('post = {:post}', { post: postId }),
    sort: 'created',
  })
  return records.map(toComment)
}

export async function addComment(postId: string, authorId: string, text: string): Promise<Comment> {
  const record = await pb
    .collection('feed_comments')
    .create({ post: postId, author: authorId, text })
  return toComment(record)
}
