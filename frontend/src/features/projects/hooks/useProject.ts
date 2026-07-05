import { useQuery } from '@tanstack/react-query'
import { getProject } from '../api/projects'

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'one', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  })
}
