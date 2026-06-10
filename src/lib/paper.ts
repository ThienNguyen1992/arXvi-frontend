export function extractArxivId(paper: Record<string, unknown>): string {
  const nested = paper.paper as Record<string, unknown> | undefined
  const value = paper.arxiv_id ?? nested?.arxiv_id
  if (value == null) return ""
  const id = String(value).trim()
  return id && id !== "undefined" && id !== "null" ? id : ""
}

export function extractPaperIds(paper: Record<string, unknown>) {
  const nested = paper.paper as Record<string, unknown> | undefined
  const arxivId = extractArxivId(paper)
  return [
    ...new Set(
      [arxivId, paper.id, paper.paper_id, nested?.id]
        .filter((value) => value != null && String(value).trim() !== "")
        .map(String)
    ),
  ]
}

/** Prefer arxiv_id — matches favorites/history API and paper detail route */
export function getPaperRouteId(paper: Record<string, unknown>) {
  return extractPaperIds(paper)[0] ?? ""
}

export function isValidPaperId(id?: string | null) {
  return !!id && id !== "undefined" && id !== "null"
}

export function extractPaperTopicCodes(paper: Record<string, unknown>): string[] {
  const raw =
    paper.categories ??
    paper.topics ??
    paper.topic_codes ??
    paper.tags

  if (!Array.isArray(raw)) return []

  const codes: string[] = []
  for (const item of raw) {
    if (typeof item === "string") {
      codes.push(item)
      continue
    }
    if (item && typeof item === "object" && typeof (item as Record<string, unknown>).code === "string") {
      codes.push((item as Record<string, unknown>).code as string)
    }
  }

  return [...new Set(codes)]
}
