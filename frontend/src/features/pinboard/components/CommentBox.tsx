import { useState } from 'react'
import { Button } from '@/core/components/Button'

export function CommentBox({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')

  const submit = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Kommentieren…"
        className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
      />
      <Button onClick={submit}>Senden</Button>
    </div>
  )
}
