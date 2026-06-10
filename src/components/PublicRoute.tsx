import { Navigate, Outlet } from "react-router-dom"

export default function PublicRoute() {
  const token = localStorage.getItem("access_token")

  if (token) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
