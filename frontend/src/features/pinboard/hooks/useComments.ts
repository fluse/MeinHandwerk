import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addComment, listComments } from '../api/comments'

function commentsQueryKey(postId: string) {
  return ['comments', postId] as const
}

export function useComments(postId: string, enabled = true) {
  return useQuery({
    queryKey: commentsQueryKey(postId),
    queryFn: () => listComments(postId),
    enabled,
  })
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ authorId, text }: { authorId: string; text: string }) =>
      addComment(postId, authorId, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentsQueryKey(postId) }),
  })
}
