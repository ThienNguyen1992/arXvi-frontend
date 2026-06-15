import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="shrink-0 text-success" />,
  error: <XCircle size={18} className="shrink-0 text-destructive" />,
  info: <Info size={18} className="shrink-0 text-primary" />,
}

const styles: Record<ToastType, string> = {
  success: 'glass-card border-primary/35 text-foreground shadow-glow',
  error: 'glass-card border-destructive/40 text-foreground shadow-glow',
  info: 'glass-card border-border text-foreground shadow-card',
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(true)

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => onDismiss(item.id), 300)
  }, [item.id, onDismiss])

  React.useEffect(() => {
    const timer = setTimeout(dismiss, item.duration ?? 3500)
    return () => clearTimeout(timer)
  }, [dismiss, item.duration])

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 min-w-[260px] max-w-[380px]',
        styles[item.type],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
    >
      {icons[item.type]}
      <span className="flex-1 text-foreground">{item.message}</span>
      <button
        type="button"
        onClick={dismiss}
        className="ml-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center pointer-events-none">
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItem item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
