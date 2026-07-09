import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './landing'
import Login from './login'
import Signup from './signup'
import ForgotPass from './forgotpass'
import OtpPage from './otppage'
import UpdatePassword from './updatepassword'
import Dashboard from './frontend/Dashboard'
import Inventory from './frontend/Inventory'
import RecommendationPanel from './frontend/RecommendationPanel'
import DemandPilot from './frontend/DemandPilot'
import Uploads from './frontend/Uploads'
import Forecasts from './frontend/Forecasts'
import Alerts from './frontend/Alerts'
import Profile from './frontend/Profile'
import Supplychain from './frontend/Supplychain'

const AUTH_KEY = 'demandpilot-authenticated'

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true' || sessionStorage.getItem(AUTH_KEY) === 'true'
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />
}

function LoginRoute() {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPass />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/inventory/recommendations" element={<ProtectedRoute><RecommendationPanel /></ProtectedRoute>} />
      <Route path="/uploads" element={<ProtectedRoute><Uploads /></ProtectedRoute>} />
      <Route path="/forecasts" element={<ProtectedRoute><Forecasts /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      <Route path="/supply-chain" element={<ProtectedRoute><Supplychain /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/demand-pilot" element={<ProtectedRoute><DemandPilot /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
