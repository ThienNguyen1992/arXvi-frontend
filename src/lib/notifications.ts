import { extractArxivId } from '@/lib/paper'

export interface NotificationPaper {
  arxiv_id?: string
  id?: string
  title?: string
  abstract?: string
  summary?: string
  authors?: string[] | string
  pdf_url?: string
  pdfLink?: string
  category?: string
  categories?: Array<string | { code?: string; title?: string }>
  topics?: string[]
}

export interface NotificationItem {
  id: string
  title?: string
  message?: string
  body?: string
  createdAt?: string
  created_at?: string
  unread?: boolean
  read?: boolean
  readAt?: string | null
  papers?: NotificationPaper[]
  // legacy flat fields on notification root
  summary?: string
  pdfLink?: string
  paper_id?: string
  reference_id?: string
}

export function parseNotificationsList(data: unknown): NotificationItem[] {
  if (!data) return []
  if (Array.isArray(data)) return data as NotificationItem[]
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as NotificationItem[]
    if (Array.isArray(obj.notifications)) return obj.notifications as NotificationItem[]
  }
  return []
}

export function parseNotificationsResponse(data: unknown, limit: number) {
  const items = parseNotificationsList(data)

  if (typeof data === 'object' && data) {
    const obj = data as Record<string, unknown>
    if (typeof obj.hasMore === 'boolean') return { items, hasMore: obj.hasMore }
    if (typeof obj.hasNextPage === 'boolean') return { items, hasMore: obj.hasNextPage }

    const meta = obj.meta as Record<string, unknown> | undefined
    if (meta && typeof meta.hasNextPage === 'boolean') {
      return { items, hasMore: meta.hasNextPage }
    }

    const total = obj.total
    const page = obj.page
    const pageSize = typeof obj.size === 'number' ? obj.size : limit
    if (typeof total === 'number' && typeof page === 'number') {
      return { items, hasMore: page * pageSize < total }
    }
  }

  return { items, hasMore: items.length >= limit }
}

export function parseUnreadCount(data: unknown): number {
  if (typeof data === 'number') return data
  if (typeof data === 'object' && data) {
    const obj = data as Record<string, unknown>
    if (typeof obj.count === 'number') return obj.count
    if (typeof obj.unreadCount === 'number') return obj.unreadCount
  }
  return 0
}

export function isNotificationUnread(notification: NotificationItem): boolean {
  if (typeof notification.unread === 'boolean') return notification.unread
  if (typeof notification.read === 'boolean') return !notification.read
  if ('readAt' in notification) return !notification.readAt
  return false
}

export function getNotificationCreatedAt(notification: NotificationItem): string | null {
  return notification.createdAt ?? notification.created_at ?? null
}

export function getNotificationPapers(notification: NotificationItem): NotificationPaper[] {
  if (Array.isArray(notification.papers) && notification.papers.length > 0) {
    return notification.papers
  }

  if (notification.title || notification.summary || notification.paper_id || notification.reference_id) {
    return [
      {
        arxiv_id: notification.paper_id || notification.reference_id,
        title: notification.title,
        summary: notification.summary,
        pdfLink: notification.pdfLink,
      },
    ]
  }

  return []
}

export function getPaperAbstract(paper: NotificationPaper): string {
  return (paper.abstract || paper.summary || '').trim()
}

export function getPaperPdfUrl(paper: NotificationPaper): string {
  return (paper.pdf_url || paper.pdfLink || '').trim()
}

export function getPaperRouteId(paper: NotificationPaper): string {
  return extractArxivId(paper as Record<string, unknown>) || paper.arxiv_id || paper.id || ''
}

export function formatPaperAuthors(authors?: string[] | string): string {
  if (!authors) return ''
  return Array.isArray(authors) ? authors.join(', ') : authors
}

export function formatNotificationDate(value: string | null): string {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function formatRelativeNotificationTime(value: string | null): string {
  if (!value) return ''
  try {
    const diffMs = Date.now() - new Date(value).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

export function getPaperCategory(paper: NotificationPaper): string {
  if (paper.category) return paper.category

  const raw = paper.categories ?? paper.topics
  if (!raw || !Array.isArray(raw) || raw.length === 0) return ''

  const first = raw[0]
  if (typeof first === 'string') return first
  return first.title || first.code || ''
}

export function flattenNotificationRows(notifications: NotificationItem[]) {
  const rows: Array<{
    key: string
    notificationId: string
    paper: NotificationPaper
    unread: boolean
    createdAt: string | null
  }> = []

  for (const notification of notifications) {
    const papers = getNotificationPapers(notification)
    const unread = isNotificationUnread(notification)
    const createdAt = getNotificationCreatedAt(notification)

    if (papers.length === 0) continue

    papers.forEach((paper, index) => {
      const routeId = getPaperRouteId(paper)
      rows.push({
        key: `${notification.id}-${routeId || index}`,
        notificationId: notification.id,
        paper,
        unread,
        createdAt,
      })
    })
  }

  return rows
}
