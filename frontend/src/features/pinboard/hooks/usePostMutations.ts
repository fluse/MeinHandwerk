import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost, deletePost, setLikes, setPinned, setResolved } from '../api/posts'
import type { Post } from '../types/post'
import { postsQueryKey } from './usePosts'

function useInvalidatePosts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: postsQueryKey })
}

export function useCreatePost() {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: createPost,
    onSuccess: invalidate,
  })
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: deletePost,
    onSuccess: invalidate,
  })
}

export function useToggleLike() {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: ({ post, userId }: { post: Post; userId: string }) => {
      const likes = post.likes.includes(userId)
        ? post.likes.filter((id) => id !== userId)
        : [...post.likes, userId]
      return setLikes(post.id, likes)
    },
    onSuccess: invalidate,
  })
}

export function useTogglePin() {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (post: Post) => setPinned(post.id, !post.pinned),
    onSuccess: invalidate,
  })
}

export function useToggleResolved() {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (post: Post) => setResolved(post.id, !post.resolved),
    onSuccess: invalidate,
  })
}
