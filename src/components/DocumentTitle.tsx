import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { resolveRouteTitle, setDocumentTitle } from "@/lib/document-title"

export function DocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith("/paper/")) return

    const title = resolveRouteTitle(pathname)
    setDocumentTitle(title)
  }, [pathname])

  return null
}
