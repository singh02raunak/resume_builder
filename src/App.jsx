import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { DashboardLayout } from './components/layout/DashboardLayout'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Dashboard from './pages/dashboard/Dashboard'
import ResumeBuilder from './pages/dashboard/ResumeBuilder'
import CoverLetterBuilder from './pages/dashboard/CoverLetterBuilder'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected dashboard routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resume/new" element={<ResumeBuilder />} />
            <Route path="/resume/:id" element={<ResumeBuilder />} />
            <Route path="/cover-letter/new" element={<CoverLetterBuilder />} />
            <Route path="/cover-letter/:id" element={<CoverLetterBuilder />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
