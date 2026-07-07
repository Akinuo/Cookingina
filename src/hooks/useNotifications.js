import { useEffect, useRef, useState, useCallback } from 'react'
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../services/firebase'

/**
 * Real-time notification listener.
 * Watches the `notifications/{uid}` subcollection and fires a callback
 * for every new unread notification that arrives.
 *
 * Notification document shape:
 * {
 *   type:      'like' | 'follow' | 'comment'
 *   fromUid:   string
 *   fromName:  string
 *   postId?:   string
 *   read:      boolean
 *   createdAt: timestamp
 * }
 */
export function useNotifications(uid, onNew) {
  const prevIds = useRef(new Set())
  const firstLoad = useRef(true)

  useEffect(() => {
    if (!uid) return

    const q = query(
      collection(db, 'notifications', uid, 'items'),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsub = onSnapshot(q, (snap) => {
      // Skip initial load burst — only react to new docs
      if (firstLoad.current) {
        snap.docs.forEach(d => prevIds.current.add(d.id))
        firstLoad.current = false
        return
      }

      snap.docChanges().forEach(change => {
        if (change.type === 'added' && !prevIds.current.has(change.doc.id)) {
          prevIds.current.add(change.doc.id)
          onNew(change.doc.data())
        }
      })
    })

    return unsub
  }, [uid, onNew])
}

/**
 * Persistent notification inbox — the full read + unread history, for a
 * bell-icon dropdown/page. Separate listener from useNotifications() above
 * (which only ever surfaces brand-new unread items for toasts) so marking
 * things read here doesn't interfere with the toast stream.
 */
export function useNotificationsList(uid, pageSize = 30) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      // Defer — calling setState synchronously in an effect body can
      // trigger cascading renders; a microtask still resolves before paint.
      queueMicrotask(() => { setItems([]); setLoading(false) })
      return
    }

    const q = query(
      collection(db, 'notifications', uid, 'items'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    )

    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))

    return unsub
  }, [uid, pageSize])

  const unreadCount = items.reduce((n, item) => n + (item.read ? 0 : 1), 0)

  const markAsRead = useCallback(async (notifId) => {
    if (!uid) return
    try { await updateDoc(doc(db, 'notifications', uid, 'items', notifId), { read: true }) }
    catch { /* non-critical — will retry next time the item is opened */ }
  }, [uid])

  const markAllAsRead = useCallback(async () => {
    if (!uid) return
    const unread = items.filter(n => !n.read)
    if (!unread.length) return
    try {
      const batch = writeBatch(db)
      unread.forEach(n => batch.update(doc(db, 'notifications', uid, 'items', n.id), { read: true }))
      await batch.commit()
    } catch { /* non-critical */ }
  }, [uid, items])

  return { items, unreadCount, loading, markAsRead, markAllAsRead }
}
