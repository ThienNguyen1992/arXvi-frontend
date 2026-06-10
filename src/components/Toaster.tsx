import type { ReactNode } from "react"
import { CheckCircle2, Info, XCircle } from "lucide-react"
import { useToastStore, type ToastType } from "@/store/useToastStore"
import { cn } from "@/lib/utils"

const iconByType: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="size-4 shrink-0 text-primary" />,
  error: <XCircle className="size-4 shrink-0 text-destructive" />,
  info: <Info className="size-4 shrink-0 text-muted-foreground" />,
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg animate-in fade-in slide-in-from-top-2 duration-300",
            t.type === "success" && "border-primary/30",
            t.type === "error" && "border-destructive/30",
            t.type === "info" && "border-border"
          )}
        >
          {iconByType[t.type]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
