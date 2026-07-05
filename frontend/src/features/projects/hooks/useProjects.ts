import { useQuery } from '@tanstack/react-query'
import { listProjects } from '../api/projects'

export const projectsQueryKey = ['projects'] as const

export function useProjects() {
  return useQuery({
    queryKey: projectsQueryKey,
    queryFn: listProjects,
  })
}
