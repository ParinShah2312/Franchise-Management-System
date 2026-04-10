import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

import { useAuth } from '../context/AuthContext';
import { ROLE_REDIRECTS } from '../utils';

export default function ProtectedRoute({ allowedRoles = [], allowReset = false, children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const normalizedRole = (user?.role || '').toUpperCase();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- allowedRoles is a new array ref each render; stringify stabilizes the memo
  const allowedSet = useMemo(
    () => allowedRoles.map((role) => role.toUpperCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(allowedRoles)],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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