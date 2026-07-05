import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTimeEntry, deleteTimeEntry, updateTimeEntry } from '../api/timelog'
import type { TimeEntryFormInput } from '../types/timelog'

function useInvalidateTimelog() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['timelog'] })
}

export function useCreateTimeEntry() {
  const invalidate = useInvalidateTimelog()
  return useMutation({
    mutationFn: createTimeEntry,
    onSuccess: invalidate,
  })
}

export function useUpdateTimeEntry() {
  const invalidate = useInvalidateTimelog()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TimeEntryFormInput }) =>
      updateTimeEntry(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteTimeEntry() {
  const invalidate = useInvalidateTimelog()
  return useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: invalidate,
  })
}
