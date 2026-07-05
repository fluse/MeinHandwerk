import { useEffect, useRef, type PointerEvent } from 'react'

interface DrawState {
  on: boolean
  last: { x: number; y: number } | null
  dirty: boolean
}

export function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const state = useRef<DrawState>({ on: false, last: null, dirty: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth || 300
    const height = 180
    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1c2a3a'
  }, [])

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    state.current.on = true
    state.current.last = pos(e)
    try {
      canvasRef.current?.setPointerCapture(e.pointerId)
    } catch {
      // ignore – nicht alle Pointer-Typen unterstützen capture
    }
  }

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!state.current.on) return
    e.preventDefault()
    const p = pos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !state.current.last) return
    ctx.beginPath()
    ctx.moveTo(state.current.last.x, state.current.last.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    state.current.last = p
    state.current.dirty = true
  }

  const up = () => {
    if (!state.current.on) return
    state.current.on = false
    if (state.current.dirty && canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'))
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    state.current.dirty = false
    onChange('')
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="block h-[180px] w-full touch-none cursor-crosshair"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-6 border-b border-dashed border-border" />
        <div className="pointer-events-none absolute bottom-2 left-3 text-xs text-[#B9C0B0]">
          Hier unterschreiben
        </div>
      </div>
      <button
        type="button"
        onClick={clear}
        className="mt-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted"
      >
        Unterschrift löschen
      </button>
    </div>
  )
}
