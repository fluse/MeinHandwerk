import { useState } from 'react'
import { CheckCircle2, MessageCircle, Pin, ThumbsUp, Trash2 } from 'lucide-react'
import { RoleIcon } from '@/core/components/RoleIcon'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { colorVar } from '@/core/lib/cssVar'
import { ROLES } from '@/core/lib/roles'
import type { RosterMember } from '@/core/api/roster'
import { useAddComment, useComments } from '../hooks/useComments'
import { useToggleLike, useTogglePin, useToggleResolved } from '../hooks/usePostMutations'
import { CATEGORIES, RESOLVABLE, type Post } from '../types/post'
import { CommentBox } from './CommentBox'

function ago(iso: string): string {
  if (!iso || Number.isNaN(new Date(iso).getTime())) return ''
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return 'gerade eben'
  if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min`
  if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std`
  const d = new Date(iso)
  return (
    d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  )
}

interface PostCardProps {
  post: Post
  roster: RosterMember[]
  currentUserId: string
  canPlan: boolean
  onDelete: () => void
}

export function PostCard({ post: p, roster, currentUserId, canPlan, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: comments = [] } = useComments(p.id, showComments)
  const addComment = useAddComment(p.id)
  const toggleLike = useToggleLike()
  const togglePin = useTogglePin()
  const toggleResolved = useToggleResolved()

  const author = roster.find((m) => m.id === p.author)
  const cat = CATEGORIES[p.category]
  const liked = p.likes.includes(currentUserId)
  const mine = p.author === currentUserId
  const canResolve = (mine || canPlan) && RESOLVABLE.includes(p.category)

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-2xl border bg-card p-3.5"
      style={{
        borderColor: p.pinned ? '#D9A441' : 'var(--color-border)',
        boxShadow: p.pinned ? '0 2px 10px rgba(217,164,65,.18)' : 'none',
        opacity: p.resolved ? 0.72 : 1,
      }}
    >
      {p.pinned && (
        <div className="mb-1.5 flex items-center gap-1 text-xs font-extrabold text-[#B07E1E]">
          <Pin size={12} /> Angepinnt
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {author && <RoleIcon role={author.role} size={26} />}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{author?.name ?? 'Unbekannt'}</div>
          <div className="text-xs text-muted">
            {author && ROLES[author.role].label}
            {ago(p.created) && ` · ${ago(p.created)}`}
          </div>
        </div>
        <span
          className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{
            color: colorVar(`cat-${p.category}`),
            background: `color-mix(in srgb, ${colorVar(`cat-${p.category}`)} 12%, transparent)`,
          }}
        >
          <cat.icon size={12} className="mr-1 inline-block align-text-bottom" />
          {cat.label}
        </span>
      </div>

      {p.text && <div className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed">{p.text}</div>}
      {p.imageUrl && (
        <img
          src={p.imageUrl}
          alt=""
          className="mt-2.5 max-h-64 w-full rounded-lg border border-border object-cover"
        />
      )}
      {p.resolved && (
        <div className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-status-erledigt-bg px-2.5 py-1 text-xs font-bold text-status-erledigt-fg">
          <CheckCircle2 size={14} /> Geklärt
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3.5">
        <button
          type="button"
          onClick={() => toggleLike.mutate({ post: p, userId: currentUserId })}
          className={`flex items-center gap-1 text-sm font-bold ${liked ? 'text-sage-deep' : 'text-muted'}`}
        >
          <ThumbsUp size={15} /> {p.likes.length > 0 ? p.likes.length : ''}{' '}
          <span className="font-semibold">{liked ? 'Gefällt dir' : 'Gefällt mir'}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1 text-sm font-semibold text-muted"
        >
          <MessageCircle size={15} /> {comments.length > 0 ? `${comments.length} ` : ''}Kommentare
        </button>
        {canResolve && (
          <button
            type="button"
            onClick={() => toggleResolved.mutate(p)}
            className="text-sm font-semibold text-sage-deep"
          >
            {p.resolved ? 'Wieder offen' : 'Als geklärt markieren'}
          </button>
        )}
        <div className="flex-1" />
        {canPlan && (
          <button
            type="button"
            onClick={() => togglePin.mutate(p)}
            title="Anpinnen"
            className={p.pinned ? 'text-[#D9A441]' : 'text-muted'}
          >
            <Pin size={16} fill={p.pinned ? 'currentColor' : 'none'} />
          </button>
        )}
        {(mine || canPlan) && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            title="Beitrag löschen"
            aria-label="Beitrag löschen"
            className="text-danger"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {showComments && (
        <div className="mt-2.5 border-t border-border pt-2">
          {comments.map((c) => {
            const commentAuthor = roster.find((m) => m.id === c.author)
            return (
              <div key={c.id} className="mb-2 flex gap-2">
                {commentAuthor && <RoleIcon role={commentAuthor.role} size={22} />}
                <div className="flex-1 rounded-lg bg-page px-2.5 py-1.5">
                  <div className="text-xs font-bold">
                    {commentAuthor?.name ?? 'Unbekannt'}
                    {ago(c.created) && (
                      <span className="font-medium text-muted"> · {ago(c.created)}</span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{c.text}</div>
                </div>
              </div>
            )
          })}
          <CommentBox onSend={(text) => addComment.mutate({ authorId: currentUserId, text })} />
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Beitrag löschen?"
        confirmLabel="Löschen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete()
        }}
      />
    </div>
  )
}
