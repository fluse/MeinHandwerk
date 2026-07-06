import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthProvider'
import { useRoster } from '@/core/hooks/useRoster'
import { RoleIcon } from '@/core/components/RoleIcon'
import { Button } from '@/core/components/Button'
import { ROLES, type Role } from '@/core/lib/roles'
import { fmtLong } from '@/core/lib/date'
import { downloadCSV } from '@/core/lib/csv'
import { useTimelog } from '../hooks/useTimelog'
import { useOrderLookup } from '../hooks/useOrderLookup'
import { TimeEntryDialog } from '../components/TimeEntryDialog'
import { currentMonth, monthLabel, monthRange, monthShift } from '../lib/month'
import type { TimeEntry } from '../types/timelog'

const ROLE_ORDER: Record<string, number> = { chef: 0, buero: 1, monteur: 2, helfer: 3 }

function fmtH(h: number): string {
  return `${(Math.round((h || 0) * 100) / 100).toString().replace('.', ',')} h`
}

export function TimetrackingPage() {
  const { user, canPlan } = useAuth()
  const { data: roster = [] } = useRoster()
  const { data: orders = [] } = useOrderLookup()
  const [month, setMonth] = useState(currentMonth())
  const [detailId, setDetailId] = useState<string | null>(canPlan ? null : (user?.id ?? null))
  const [dialogEntry, setDialogEntry] = useState<TimeEntry | 'new' | null>(null)

  const { from, to } = monthRange(month)
  const { data: monthEntries = [] } = useTimelog(from, to)

  const orderTitle = (id: string) => orders.find((o) => o.id === id)?.title || '(ohne Auftrag)'
  const detailName = canPlan ? detailId : (user?.id ?? null)

  const relevantIds = canPlan
    ? Array.from(
        new Set([
          ...roster.filter((m) => m.role === 'monteur' || m.role === 'helfer').map((m) => m.id),
          ...monthEntries.map((e) => e.employee),
        ]),
      )
    : [user?.id ?? '']

  const totals = relevantIds
    .map((id) => {
      const es = monthEntries.filter((e) => e.employee === id)
      const member = roster.find((m) => m.id === id)
      return {
        id,
        name: member?.name ?? id,
        role: member?.role as Role | undefined,
        hours: es.reduce((s, e) => s + e.hours, 0),
        travel: es.reduce((s, e) => s + e.travel, 0),
      }
    })
    .sort(
      (a, b) =>
        (ROLE_ORDER[a.role ?? ''] ?? 9) - (ROLE_ORDER[b.role ?? ''] ?? 9) ||
        a.name.localeCompare(b.name),
    )

  const grand = totals.reduce((s, t) => s + t.hours, 0)
  const grandTravel = totals.reduce((s, t) => s + t.travel, 0)

  const exportMonth = () => {
    const rows: Array<Array<string | number>> = [
      [
        'Mitarbeiter',
        'Datum',
        'Ankunft Kunde',
        'Abfahrt Kunde',
        'Arbeitsstunden',
        'Abfahrt Baustelle',
        'Ankunft Firma/Zuhause',
        'Fahrzeit',
        'Auftrag',
        'Notiz',
      ],
    ]
    ;[...monthEntries]
      .sort((a, b) => (a.employee + a.date).localeCompare(b.employee + b.date))
      .forEach((e) => {
        const name = roster.find((m) => m.id === e.employee)?.name ?? e.employee
        rows.push([
          name,
          e.date,
          e.von,
          e.bis,
          String(e.hours).replace('.', ','),
          e.travelVon,
          e.travelBis,
          String(e.travel).replace('.', ','),
          e.order ? orderTitle(e.order) : '',
          e.note,
        ])
      })
    rows.push([])
    rows.push([`Summen je Mitarbeiter (Monat ${month})`, '', '', '', 'Arbeit', '', '', 'Fahrt'])
    totals.forEach((t) =>
      rows.push([
        t.name,
        '',
        '',
        '',
        String(t.hours).replace('.', ','),
        '',
        '',
        String(t.travel).replace('.', ','),
      ]),
    )
    rows.push([
      'GESAMT',
      '',
      '',
      '',
      String(grand).replace('.', ','),
      '',
      '',
      String(grandTravel).replace('.', ','),
    ])
    downloadCSV(`Zeiten_${month}.csv`, rows)
  }

  const nav = (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3.5 py-2.5">
      <button
        type="button"
        onClick={() => setMonth((m) => monthShift(m, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-page font-bold text-sage-deep"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="flex-1 text-center text-sm font-extrabold capitalize text-ink">
        {monthLabel(month)}
      </div>
      <button
        type="button"
        onClick={() => setMonth((m) => monthShift(m, 1))}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-page font-bold text-sage-deep"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )

  if (detailName) {
    const member = roster.find((m) => m.id === detailName)
    const es = monthEntries.filter((e) => e.employee === detailName)
    const total = es.reduce((s, e) => s + e.hours, 0)
    const byDay: Record<string, TimeEntry[]> = {}
    es.forEach((e) => {
      ;(byDay[e.date] ??= []).push(e)
    })
    const days = Object.keys(byDay).sort().reverse()
    const byOrder: Record<string, number> = {}
    es.forEach((e) => {
      const k = e.order || 'none'
      byOrder[k] = (byOrder[k] || 0) + e.hours
    })

    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-3 text-lg font-bold text-ink">Arbeitszeiten</h1>
        {nav}
        <div className="mt-3 flex items-center gap-2.5">
          {canPlan && (
            <button
              type="button"
              onClick={() => setDetailId(null)}
              className="flex items-center rounded-full border border-border px-2.5 py-1.5 text-xs font-semibold text-muted"
            >
              <ChevronLeft size={14} /> Übersicht
            </button>
          )}
          <div className="flex flex-1 items-center gap-2">
            {member && <RoleIcon role={member.role} size={24} />}
            <div className="text-base font-extrabold">{member?.name ?? ''}</div>
          </div>
          <div className="text-base font-extrabold text-sage-deep">{fmtH(total)}</div>
        </div>

        <div className="mt-2.5">
          <Button className="w-full" onClick={() => setDialogEntry('new')}>
            <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
            Zeit erfassen
          </Button>
        </div>

        {days.length === 0 ? (
          <div className="py-9 text-center text-sm text-muted">Keine Zeiten in diesem Monat.</div>
        ) : (
          <>
            {days.map((d) => {
              const list = byDay[d]
              const dtot = list.reduce((s, e) => s + e.hours, 0)
              const dtrav = list.reduce((s, e) => s + e.travel, 0)
              return (
                <div key={d} className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="text-xs font-extrabold capitalize text-sage-deep">
                      {fmtLong(d)}
                    </div>
                    <div className="text-xs font-extrabold text-muted">
                      {fmtH(dtot)}
                      {dtrav > 0 ? ` · ${fmtH(dtrav)} Fahrt` : ''}
                    </div>
                  </div>
                  {list.map((e) => (
                    <div
                      key={e.id}
                      className="mb-1.5 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => setDialogEntry(e)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm font-bold">{orderTitle(e.order)}</div>
                        <div className="text-xs text-muted">
                          {[
                            e.von && e.bis ? `Kunde ${e.von}–${e.bis}` : '',
                            e.travelVon && e.travelBis ? `Fahrt ${e.travelVon}–${e.travelBis}` : '',
                            e.note || '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </button>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-sage-deep">{fmtH(e.hours)}</div>
                        {e.travel > 0 && (
                          <div className="text-xs text-muted">+{fmtH(e.travel)} Fahrt</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
            <div className="mt-4">
              <div className="mb-2 text-xs font-extrabold text-sage-deep">Summe je Auftrag</div>
              {Object.keys(byOrder).map((k) => (
                <div key={k} className="flex justify-between border-b border-border py-1.5 text-sm">
                  <span>{k === 'none' ? '(ohne Auftrag)' : orderTitle(k)}</span>
                  <b className="text-sage-deep">{fmtH(byOrder[k])}</b>
                </div>
              ))}
            </div>
          </>
        )}

        {dialogEntry && (
          <TimeEntryDialog
            entry={dialogEntry === 'new' ? undefined : dialogEntry}
            defaultEmployeeId={detailName}
            canPlan={canPlan}
            roster={roster}
            onClose={() => setDialogEntry(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-3 text-lg font-bold text-ink">Arbeitszeiten</h1>
      {nav}
      <div className="mt-3">
        <Button className="w-full" onClick={() => setDialogEntry('new')}>
          <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
          Zeit erfassen
        </Button>
      </div>
      <div className="mt-3.5 flex items-center justify-between">
        <div className="text-xs font-extrabold text-sage-deep">Monatssummen</div>
        <div className="text-sm font-extrabold">
          Gesamt: {fmtH(grand)}
          {grandTravel > 0 ? ` · Fahrt ${fmtH(grandTravel)}` : ''}
        </div>
      </div>
      {totals.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setDetailId(t.id)}
          className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-3 text-left"
        >
          {t.role && <RoleIcon role={t.role} size={26} />}
          <div className="flex-1">
            <div className="text-sm font-bold">{t.name}</div>
            <div className="text-xs text-muted">{t.role ? ROLES[t.role].label : ''}</div>
          </div>
          <div className="text-right">
            <div
              className={`text-base font-extrabold ${t.hours > 0 ? 'text-sage-deep' : 'text-muted'}`}
            >
              {fmtH(t.hours)}
            </div>
            {t.travel > 0 && <div className="text-xs text-muted">+ {fmtH(t.travel)} Fahrt</div>}
          </div>
          <ChevronRight size={18} className="text-muted" />
        </button>
      ))}
      <div className="mt-3">
        <Button variant="secondary" className="w-full" onClick={exportMonth}>
          <Download size={16} className="mr-1.5 inline-block align-text-bottom" />
          Monat als CSV exportieren
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Grundlage für die Lohnabrechnung. Tippe auf einen Mitarbeiter für die tägliche Aufstellung.
      </p>

      {dialogEntry && (
        <TimeEntryDialog
          entry={dialogEntry === 'new' ? undefined : dialogEntry}
          defaultEmployeeId={user?.id ?? ''}
          canPlan={canPlan}
          roster={roster}
          onClose={() => setDialogEntry(null)}
        />
      )}
    </div>
  )
}
