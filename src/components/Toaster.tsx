import type { ReactNode } from "react"
import { CheckCircle2, Info, XCircle, X } from "lucide-react"
import { useToastStore, type ToastType } from "@/store/useToastStore"
import { cn } from "@/lib/utils"

const toastStyles: Record<ToastType, string> = {
  success:
    "glass-card border-primary/35 text-foreground shadow-glow",
  error:
    "glass-card border-destructive/40 text-foreground shadow-glow",
  info:
    "glass-card border-border text-foreground shadow-card",
}

const iconByType: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="size-[18px] shrink-0 text-success" />,
  error: <XCircle className="size-[18px] shrink-0 text-destructive" />,
  info: <Info className="size-[18px] shrink-0 text-primary" />,
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-[9999] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300",
            toastStyles[t.type]
          )}
        >
          {iconByType[t.type]}
          <span className="flex-1 text-foreground">{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
