import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ToastProvider } from "@/components/ui/toast"
import { DocumentTitle } from "@/components/DocumentTitle"
import { Toaster } from "@/components/Toaster"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import SignUpPage from "@/pages/SignUpPage"
import TourPage from "@/pages/TourPage"
import PaperDetailPage from "@/pages/PaperDetailPage"
import ManageTopicsPage from "@/pages/ManageTopicsPage"
import LeaderboardPage from "@/pages/LeaderboardPage"
import MainLayout from "@/components/layout/MainLayout"
import ProtectedRoute from "@/components/ProtectedRoute"
import PublicRoute from "@/components/PublicRoute"

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <DocumentTitle />
        <Toaster />
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/tour" element={<TourPage />} />
            <Route path="/paper/:id" element={<PaperDetailPage />} />

            <Route element={<MainLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/favorites" element={<HomePage />} />
              <Route path="/history" element={<HomePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/manage-topics" element={<ManageTopicsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
