import { useQuery } from "@tanstack/react-query"
import { getCurrentUser } from "@/lib/api"

export const CURRENT_USER_QUERY_KEY = ["currentUser"] as const

export type CurrentUser = {
  isFirstLogged?: boolean
  is_first_logged?: boolean
  [key: string]: unknown
}

export function isFirstLogin(user: CurrentUser | null | undefined) {
  return Boolean(user?.isFirstLogged ?? user?.is_first_logged)
}

export function useCurrentUser(enabled = true) {
  const hasToken = Boolean(localStorage.getItem("access_token"))

  return useQuery<CurrentUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    enabled: enabled && hasToken,
    staleTime: 5 * 60 * 1000,
  })
}
