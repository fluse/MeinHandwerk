import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject, deleteProject, setProjectStatus, updateProject } from '../api/projects'
import type { ProjectFormInput, ProjectStatus } from '../types/project'
import { projectsQueryKey } from './useProjects'

function useInvalidateProjects() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: projectsQueryKey })
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects()
  return useMutation({
    mutationFn: createProject,
    onSuccess: invalidate,
  })
}

export function useUpdateProject() {
  const invalidate = useInvalidateProjects()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectFormInput }) =>
      updateProject(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteProject() {
  const invalidate = useInvalidateProjects()
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: invalidate,
  })
}

export function useSetProjectStatus() {
  const invalidate = useInvalidateProjects()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) =>
      setProjectStatus(id, status),
    onSuccess: invalidate,
  })
}
