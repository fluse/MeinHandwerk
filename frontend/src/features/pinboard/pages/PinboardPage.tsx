import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthProvider'
import { useRoster } from '@/core/hooks/useRoster'
import { Button } from '@/core/components/Button'
import { usePosts } from '../hooks/usePosts'
import { useDeletePost } from '../hooks/usePostMutations'
import { PostComposer } from '../components/PostComposer'
import { PostCard } from '../components/PostCard'
import { CATEGORIES, CATEGORY_VALUES, type Category } from '../types/post'

export function PinboardPage() {
  const { user, canPlan } = useAuth()
  const { data: posts = [], isLoading } = usePosts()
  const { data: roster = [] } = useRoster()
  const deletePost = useDeletePost()
  const [filter, setFilter] = useState<'alle' | Category>('alle')
  const [composerOpen, setComposerOpen] = useState(false)

  const filtered = posts.filter((p) => filter === 'alle' || p.category === filter)
  const sorted = [...filtered].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      new Date(b.created).getTime() - new Date(a.created).getTime(),
  )

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-ink">Pinnwand</h1>
        <Button onClick={() => setComposerOpen(true)}>
          <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
          Beitrag erstellen
        </Button>
      </div>

      <div className="my-3 flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter('alle')}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
            filter === 'alle' ? 'border-sage bg-page text-sage-deep' : 'border-border text-muted'
          }`}
        >
          Alle
        </button>
        {CATEGORY_VALUES.map((k) => {
          const Icon = CATEGORIES[k].icon
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
                filter === k ? 'border-sage bg-page text-sage-deep' : 'border-border text-muted'
              }`}
            >
              <Icon size={13} />
              {CATEGORIES[k].label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Beiträge werden geladen…</p>
      ) : sorted.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">
          Noch keine Beiträge. Schreib den ersten – z. B. „Wer hat den 18V-Akku aus dem Sprinter?“
        </div>
      ) : (
        sorted.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            roster={roster}
            currentUserId={user?.id ?? ''}
            canPlan={canPlan}
            onDelete={() => deletePost.mutate(p.id)}
          />
        ))
      )}

      {composerOpen && <PostComposer onClose={() => setComposerOpen(false)} />}
    </div>
  )
}
