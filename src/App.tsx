import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import SignUpPage from "@/pages/SignUpPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
