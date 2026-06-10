import { useEffect } from "react"
import { setDocumentTitle } from "@/lib/document-title"

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    setDocumentTitle(title)
  }, [title])
}
