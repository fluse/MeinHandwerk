import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthProvider'
import { Button } from '@/core/components/Button'
import { useCreatePost } from '../hooks/usePostMutations'
import { CATEGORIES, CATEGORY_VALUES, type Category } from '../types/post'

export function PostComposer() {
  const { user } = useAuth()
  const create = useCreatePost()
  const [text, setText] = useState('')
  const [category, setCategory] = useState<Category>('info')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File | null) => {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const clearFile = () => {
    pickFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = () => {
    if (!text.trim() && !file) {
      setError('Bitte einen Text oder ein Foto hinzufügen.')
      return
    }
    setError('')
    create.mutate(
      { authorId: user?.id ?? '', text: text.trim(), category, file: file ?? undefined },
      {
        onSuccess: () => {
          setText('')
          setCategory('info')
          clearFile()
        },
      },
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Was gibt's? z. B. „Wer hat den 18V-Akku aus dem Sprinter?“"
        className="mb-2.5 min-h-[58px] w-full resize-y rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
      />
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {CATEGORY_VALUES.map((k) => {
          const Icon = CATEGORIES[k].icon
          return (
            <button
              key={k}
              type="button"
              onClick={() => setCategory(k)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${
                category === k ? 'border-sage bg-page text-sage-deep' : 'border-border text-muted'
              }`}
            >
              <Icon size={13} />
              {CATEGORIES[k].label}
            </button>
          )
        })}
      </div>
      {preview && (
        <div className="relative mb-2.5 inline-block">
          <img src={preview} alt="" className="max-h-32 rounded-lg border border-border" />
          <button
            type="button"
            onClick={clearFile}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/55 text-xs text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {error && <p className="mb-2 text-xs text-danger">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted"
        >
          <Camera size={14} /> Foto
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <div className="flex-1" />
        <Button disabled={create.isPending} onClick={submit}>
          Posten
        </Button>
      </div>
    </div>
  )
}
