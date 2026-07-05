import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { todayISO } from '@/core/lib/date'
import { useRoster } from '@/core/hooks/useRoster'
import { useOrder } from '../hooks/useOrder'
import { OrderForm } from '../components/OrderForm'
import type { OrderFormInput } from '../types/order'

export function OrderFormPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: roster = [] } = useRoster()
  const { data: order, isLoading } = useOrder(orderId)

  if (orderId && isLoading) {
    return <p className="text-sm text-muted">Auftrag wird geladen…</p>
  }

  const defaultValues: OrderFormInput = order
    ? {
        title: order.title,
        trade: order.trade,
        date: order.date,
        from: order.from,
        to: order.to,
        client: order.client,
        phone: order.phone,
        address: order.address,
        material: order.material,
        desc: order.desc,
        note: order.note,
        assigned: order.assigned,
        project: order.project,
      }
    : {
        title: searchParams.get('title') ?? '',
        trade: 'klima',
        date: searchParams.get('date') ?? todayISO(),
        from: searchParams.get('from') ?? '',
        to: searchParams.get('to') ?? '',
        client: searchParams.get('client') ?? '',
        phone: searchParams.get('phone') ?? '',
        address: searchParams.get('address') ?? '',
        material: '',
        desc: searchParams.get('desc') ?? '',
        note: searchParams.get('note') ?? '',
        assigned: searchParams.get('assigned') ? [searchParams.get('assigned')!] : [],
        project: searchParams.get('project') ?? '',
      }

  const goBack = () => navigate(-1)

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-ink">
        {orderId ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}
      </h1>
      <OrderForm
        orderId={orderId}
        defaultValues={defaultValues}
        roster={roster}
        onDone={goBack}
        onCancel={goBack}
      />
    </div>
  )
}
