import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent, deleteEvent, setRsvp } from '../api/events'
import type { EventFormInput, EventItem } from '../types/event'
import { eventsQueryKey } from './useEvents'

function useInvalidateEvents() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: eventsQueryKey })
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: ({ input, byId }: { input: EventFormInput; byId: string }) =>
      createEvent(input, byId),
    onSuccess: invalidate,
  })
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: invalidate,
  })
}

export function useToggleRsvp() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: ({ event, userId }: { event: EventItem; userId: string }) => {
      const rsvp = event.rsvp.includes(userId)
        ? event.rsvp.filter((id) => id !== userId)
        : [...event.rsvp, userId]
      return setRsvp(event.id, rsvp)
    },
    onSuccess: invalidate,
  })
}
