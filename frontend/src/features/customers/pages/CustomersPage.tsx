import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { Button } from '@/core/components/Button'
import { useCustomers } from '../hooks/useCustomers'
import { useDeleteCustomer } from '../hooks/useCustomerMutations'
import { CustomerCard } from '../components/CustomerCard'

export function CustomersPage() {
  const { canPlan } = useAuth()
  const navigate = useNavigate()
  const { data: customers = [], isLoading } = useCustomers()
  const deleteCustomer = useDeleteCustomer()
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const list = customers
    .filter(
      (c) =>
        !q || [c.name, c.contact, c.city, c.kdnr, c.phone].some((v) => v.toLowerCase().includes(q)),
    )
    .sort((a, b) => (a.name || a.contact).localeCompare(b.name || b.contact))

  const orderForCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id)
    if (!c) return
    const address = [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    const params = new URLSearchParams({ client: c.name || c.contact, phone: c.phone, address })
    navigate(`/orders/new?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-lg pb-16">
      <h1 className="mb-3 text-lg font-bold text-ink">Kunden</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suchen: Name, Ort, Kd-Nr, Telefon"
        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
      />

      {canPlan && (
        <div className="mt-2.5">
          <Button className="w-full" onClick={() => navigate('/customers/new')}>
            <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
            Neuer Kunde
          </Button>
        </div>
      )}

      <div className="mt-2 text-xs text-muted">
        {customers.length} Kunde{customers.length === 1 ? '' : 'n'} gespeichert
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted">Kunden werden geladen…</p>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">
          Noch keine Kunden. {canPlan ? 'Lege einen an.' : 'Bitte Chef/Büro fragen.'}
        </div>
      ) : (
        <div className="mt-3">
          {list.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              canPlan={canPlan}
              onEdit={() => navigate(`/customers/${c.id}/edit`)}
              onDelete={() => deleteCustomer.mutate(c.id)}
              onOrder={() => orderForCustomer(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
