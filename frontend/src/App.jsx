import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import FranchiseeDashboard from './pages/FranchiseeDashboard';
import Login from './pages/Login';
import RegisterFranchise from './pages/RegisterFranchise';
import RegisterFranchisor from './pages/RegisterFranchisor';
import SignupSelection from './pages/SignupSelection';
import StaffDashboard from './pages/StaffDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<SignupSelection />} />
          <Route path="/register/franchise" element={<RegisterFranchise />} />
          <Route path="/register/franchisor" element={<RegisterFranchisor />} />
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
