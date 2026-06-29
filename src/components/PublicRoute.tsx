import { Navigate, Outlet } from "react-router-dom"
import { Spinner } from "@/components/ui/spinner"
import { isFirstLogin, useCurrentUser } from "@/hooks/useCurrentUser"

export default function PublicRoute() {
  const token = localStorage.getItem("access_token")

  if (!token) {
    return <Outlet />
  }

  return <AuthenticatedPublicRedirect />
}

function AuthenticatedPublicRedirect() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-auth">
        <Spinner size={40} className="text-primary" />
      </div>
    )
  }

  if (isFirstLogin(user)) {
    return <Navigate to="/tour" replace />
  }

  return <Navigate to="/home" replace />
}
