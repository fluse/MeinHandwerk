import { pb } from '@/core/api/pocketbase'

/** Schlanker Direktzugriff auf die `customers`-Collection für die Kunden-Autovervollständigung
 *  im Projektformular – bewusst ohne Import von features/customers (Features importieren sich nicht). */
export async function listCustomerNames(): Promise<string[]> {
  const records = await pb.collection('customers').getFullList({ sort: 'name' })
  return records.map((r) => r.name || r.contact || '').filter(Boolean)
}
