import { useState, useRef, useEffect } from 'react'
import { Bell, Heart, UserPlus, MessageCircle, CheckCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotificationsList } from '../../hooks/useNotifications'

const TYPE_ICON = { like: Heart, follow: UserPlus, comment: MessageCircle }
const TYPE_COLOR = { like: '#C43030', follow: 'var(--brand)', comment: 'var(--green)' }

function timeAgo(ts) {
  if (!ts) return 'Just now'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60)     return 'Just now'
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function notifLabel(n) {
  if (n.type === 'like')    return <><strong>{n.fromName}</strong> liked your post</>
  if (n.type === 'follow')  return <><strong>{n.fromName}</strong> started following you</>
  if (n.type === 'comment') return <><strong>{n.fromName}</strong> commented on your post</>
  return n.fromName || 'New notification'
}

export default function NotificationBell({ onNavigate, align = 'left' }) {
  const { user } = useAuth()
  const { items, unreadCount, loading, markAsRead, markAllAsRead } = useNotificationsList(user?.uid)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const handleItemClick = (n) => {
    if (!n.read) markAsRead(n.id)
    setOpen(false)
    if (!onNavigate) return
    if (n.type === 'follow' && n.fromUid) onNavigate('user-profile', n.fromUid)
    else if (n.type === 'like' || n.type === 'comment') onNavigate('community')
  }

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        className="notif-bell-btn"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={() => setOpen(o => !o)}
      >
        <Bell size={19} strokeWidth={1.75} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className={`notif-panel notif-panel-${align}`}>
          <div className="notif-panel-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-markall-btn" onClick={markAllAsRead}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-panel-list">
            {loading && <div className="notif-panel-empty">Loading…</div>}

            {!loading && items.length === 0 && (
              <div className="notif-panel-empty">No notifications yet.</div>
            )}

            {!loading && items.map(n => {
              const Icon = TYPE_ICON[n.type] || Bell
              return (
                <button
                  key={n.id}
                  className={`notif-item${n.read ? '' : ' unread'}`}
                  onClick={() => handleItemClick(n)}
                >
                  <span className="notif-item-icon" style={{ color: TYPE_COLOR[n.type] || 'var(--ink-3)' }}>
                    <Icon size={15} strokeWidth={1.8} fill={n.type === 'like' ? 'currentColor' : 'none'} />
                  </span>
                  <span className="notif-item-body">
                    <span className="notif-item-text">{notifLabel(n)}</span>
                    <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="notif-item-dot" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
