const APP_NAME = "arXvi"

export const ROUTE_TITLES: Record<string, string> = {
  "/home": "Home",
  "/favorites": "Favorites",
  "/history": "History",
  "/leaderboard": "Leaderboard",
  "/login": "Log in",
  "/signup": "Sign up",
  "/tour": "Tour",
  "/manage-topics": "Manage Topics",
}

export function formatDocumentTitle(pageTitle?: string) {
  return pageTitle ? `${pageTitle} · ${APP_NAME}` : APP_NAME
}

export function setDocumentTitle(pageTitle?: string) {
  document.title = formatDocumentTitle(pageTitle)
}

export function resolveRouteTitle(pathname: string) {
  if (pathname.startsWith("/paper/")) return undefined
  return ROUTE_TITLES[pathname]
}
