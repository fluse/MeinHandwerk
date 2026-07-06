import { useQuery } from '@tanstack/react-query'
import { listOrders } from '../api/orders'

export function ordersListQueryKey(sinceISO?: string) {
  return ['orders', 'all', sinceISO ?? null] as const
}

/** `sinceISO` begrenzt das Datumsfenster (siehe OrdersListPage) – ohne Angabe werden alle
 * Termine geladen ("ältere anzeigen"). */
export function useOrdersList(sinceISO?: string) {
  return useQuery({
    queryKey: ordersListQueryKey(sinceISO),
    queryFn: () => listOrders(sinceISO),
  })
}
