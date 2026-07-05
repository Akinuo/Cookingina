import { useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
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
