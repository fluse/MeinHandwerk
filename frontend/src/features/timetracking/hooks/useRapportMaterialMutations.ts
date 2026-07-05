import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createRapportMaterial,
  deleteRapportMaterial,
  updateRapportMaterial,
} from '../api/rapportMaterials'

export function useRapportMaterialMutations(rapportId: string) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['rapport-materials', rapportId] })

  const create = useMutation({
    mutationFn: (input: { qty: string; unit: string; desc: string }) =>
      createRapportMaterial(rapportId, input),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, ...input }: { id: string; qty: string; unit: string; desc: string }) =>
      updateRapportMaterial(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: deleteRapportMaterial,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
