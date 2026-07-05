import { useQuery } from '@tanstack/react-query'
import { listRapportMaterials } from '../api/rapportMaterials'

export function useRapportMaterials(rapportId: string, enabled = true) {
  return useQuery({
    queryKey: ['rapport-materials', rapportId],
    queryFn: () => listRapportMaterials(rapportId),
    enabled,
  })
}
