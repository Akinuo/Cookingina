import { useState, useCallback } from 'react'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'default', duration = 3500) => {
    const id = ++toastId
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const success = useCallback((msg, dur)    => show(msg, 'success', dur), [show])
  const error   = useCallback((msg, dur)    => show(msg, 'error',   dur), [show])
  const warning = useCallback((msg, dur)    => show(msg, 'warning', dur), [show])
  const like    = useCallback((msg)         => show(msg, 'like',  4000),  [show])
  const follow  = useCallback((msg)         => show(msg, 'follow',4000),  [show])

  return { toasts, show, success, error, warning, like, follow }
}
