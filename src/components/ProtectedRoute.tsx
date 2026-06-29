import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Spinner } from "@/components/ui/spinner"
import { isFirstLogin, useCurrentUser } from "@/hooks/useCurrentUser"

export default function ProtectedRoute() {
  const token = localStorage.getItem("access_token")
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <ProtectedRouteContent />
}

function ProtectedRouteContent() {
  const location = useLocation()
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-auth">
        <Spinner size={40} className="text-primary" />
      </div>
    )
  }

  if (!isError && isFirstLogin(user) && location.pathname !== "/tour") {
    return <Navigate to="/tour" replace />
  }

  return <Outlet />
}
