import { useNavigate, useParams } from 'react-router-dom'
import { useCustomer } from '../hooks/useCustomer'
import { CustomerForm } from '../components/CustomerForm'

export function CustomerFormPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const { data: customer, isLoading } = useCustomer(customerId)

  if (customerId && isLoading) {
    return <p className="text-sm text-muted">Kunde wird geladen…</p>
  }

  const goBack = () => navigate(-1)

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-ink">
        {customerId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
      </h1>
      <CustomerForm customer={customer} onDone={goBack} onCancel={goBack} />
    </div>
  )
}
