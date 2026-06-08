import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ToastProvider } from "@/components/ui/toast"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import SignUpPage from "@/pages/SignUpPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import TourPage from "@/pages/TourPage"
import PaperDetailPage from "@/pages/PaperDetailPage"
import ManageTopicsPage from "@/pages/ManageTopicsPage"
import LeaderboardPage from "@/pages/LeaderboardPage"
import MainLayout from "@/components/layout/MainLayout"
import ProtectedRoute from "@/components/ProtectedRoute"

function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/tour" element={<TourPage />} />
          <Route path="/paper/:id" element={<PaperDetailPage />} />
          
          {/* Main Layout Routes (Sidebar & Header) */}
          <Route element={<MainLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/favorites" element={<HomePage />} />
            <Route path="/history" element={<HomePage />} />
            <Route path="/duplicates" element={<HomePage />} />
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

