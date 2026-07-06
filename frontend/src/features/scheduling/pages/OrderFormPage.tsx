import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { todayISO } from '@/core/lib/date'
import { useRoster } from '@/core/hooks/useRoster'
import { useOrder } from '../hooks/useOrder'
import { useOrderBlocks } from '../hooks/useOrderBlocks'
import { OrderForm } from '../components/OrderForm'
import type { OrderBlockFormInput, OrderFormInput } from '../types/order'

export function OrderFormPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: roster = [] } = useRoster()
  const { data: order, isLoading: orderLoading } = useOrder(orderId)
  const { data: existingBlocks = [], isLoading: blocksLoading } = useOrderBlocks(
    orderId ?? '',
    Boolean(orderId),
  )

  if (orderId && (orderLoading || blocksLoading)) {
    return <p className="text-sm text-muted">Auftrag wird geladen…</p>
  }

  const blocks: OrderBlockFormInput[] = order
    ? existingBlocks.map((b) => ({ date: b.date, from: b.from, to: b.to, assigned: b.assigned }))
    : [
        {
          date: searchParams.get('date') ?? todayISO(),
          from: searchParams.get('from') ?? '',
          to: searchParams.get('to') ?? '',
          assigned: searchParams.get('assigned') ? [searchParams.get('assigned')!] : [],
        },
      ]

  const defaultValues: OrderFormInput = order
    ? {
        title: order.title,
        trade: order.trade,
        client: order.client,
        phone: order.phone,
        street: order.street,
        zip: order.zip,
        city: order.city,
        material: order.material,
        desc: order.desc,
        note: order.note,
        blocks,
        project: order.project,
        customer: order.customer,
        site: order.site,
      }
    : {
        title: searchParams.get('title') ?? '',
        trade: 'klima',
        client: searchParams.get('client') ?? '',
        phone: searchParams.get('phone') ?? '',
        street: searchParams.get('street') ?? '',
        zip: searchParams.get('zip') ?? '',
        city: searchParams.get('city') ?? '',
        material: '',
        desc: searchParams.get('desc') ?? '',
        note: searchParams.get('note') ?? '',
        blocks,
        project: searchParams.get('project') ?? '',
        customer: searchParams.get('customer') ?? '',
        site: searchParams.get('site') ?? '',
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
        existingBlocks={existingBlocks}
        roster={roster}
        onDone={goBack}
        onCancel={goBack}
      />
    </div>
  )
}
