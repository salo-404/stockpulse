import { useCallback, useEffect, useMemo, useState } from 'react'
import { ToastContext } from './ToastContext'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(({ title, message, type = 'error' }) => {
    const id = crypto.randomUUID()
    const toast = { id, title, message, type }
    setToasts((current) => [...current, toast])
    window.setTimeout(() => removeToast(id), 4200)
  }, [removeToast])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  useEffect(() => {
    return () => setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-panel rounded-2xl px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            style={{
              borderColor: toast.type === 'success' ? 'rgba(0,212,170,0.3)' : 'rgba(255,77,77,0.35)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{toast.title}</p>
                <p className="mt-1 text-sm text-secondary">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-secondary transition-colors hover:text-primary"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}