import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import Features from './pages/Features';
import FranchiseeDashboard from './pages/FranchiseeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import RegisterFranchise from './pages/RegisterFranchise';
import RegisterFranchisor from './pages/RegisterFranchisor';
import SignupSelection from './pages/SignupSelection';
import StaffDashboard from './pages/StaffDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="features" element={<Features />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route
              path="reset-password"
              element={
                <ProtectedRoute allowReset>
                  <ResetPassword />
                </ProtectedRoute>
              }
            />
            <Route path="register" element={<SignupSelection />} />
            <Route path="register/franchise" element={<RegisterFranchise />} />
            <Route path="register/franchisor" element={<RegisterFranchisor />} />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['FRANCHISOR']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['BRANCH_OWNER', 'MANAGER']}>
                <FranchiseeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export { default as Toast } from './components/Toast';
