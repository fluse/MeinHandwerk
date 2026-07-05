import { pb } from '@/core/api/pocketbase'

export interface CustomerLookup {
  id: string
  label: string
  phone: string
  address: string
}

/** Schlanker Direktzugriff auf die `customers`-Collection für die Auftraggeber-Autovervollständigung
 *  im Auftragsformular – bewusst ohne Import von features/customers (Features importieren sich nicht). */
export async function listCustomerLookup(): Promise<CustomerLookup[]> {
  const records = await pb.collection('customers').getFullList({ sort: 'name' })
  return records.map((r) => ({
    id: r.id,
    label: r.name || r.contact || '',
    phone: r.phone ?? '',
    address: [r.street, [r.zip, r.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
  }))
}
