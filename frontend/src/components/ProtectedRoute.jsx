import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

import { useAuth } from '../context/AuthContext';

const ROLE_REDIRECTS = {
  FRANCHISOR: '/admin',
  BRANCH_OWNER: '/dashboard',
  MANAGER: '/manager',
  STAFF: '/staff',
};

export default function ProtectedRoute({ allowedRoles = [], allowReset = false, children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const normalizedRole = (user?.role || '').toUpperCase();
  const allowedSet = useMemo(
    () => allowedRoles.map((role) => role.toUpperCase()),
    [allowedRoles],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.mustResetPassword && !allowReset) {
    return <Navigate to="/reset-password" replace />;
  }

  if (!user?.mustResetPassword && allowReset) {
    const fallback = ROLE_REDIRECTS[normalizedRole] || '/';
    return <Navigate to={fallback} replace />;
  }

  if (allowedSet.length > 0 && !allowedSet.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  allowReset: PropTypes.bool,
  children: PropTypes.node.isRequired,
};