import { useQuery } from '@tanstack/react-query'
import { listPosts } from '../api/posts'

export const postsQueryKey = ['posts'] as const

export function usePosts() {
  return useQuery({
    queryKey: postsQueryKey,
    queryFn: listPosts,
  })
}
