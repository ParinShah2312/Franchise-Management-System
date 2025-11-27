import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const ROLE_REDIRECTS = {
  FRANCHISOR: '/admin',
  BRANCH_OWNER: '/dashboard',
  MANAGER: '/manager',
  STAFF: '/staff',
};

export default function ResetPassword() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.newPassword || !form.confirmPassword) {
      setToast({ message: 'Both fields are required.', variant: 'error' });
      return;
    }

    if (form.newPassword.length < 8) {
      setToast({ message: 'Password must be at least 8 characters.', variant: 'error' });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setToast({ message: 'Passwords do not match.', variant: 'error' });
      return;
    }

    setSubmitting(true);
    setToast(null);

    try {
      await api.post('/auth/reset-password', {
        new_password: form.newPassword,
        confirm_password: form.confirmPassword,
      });

      updateUser({ mustResetPassword: false });

      const redirectPath = ROLE_REDIRECTS[(user?.role || '').toUpperCase()] || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setToast({ message: error.message || 'Unable to reset password.', variant: 'error' });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Update your password</h1>
          <p className="text-sm text-gray-500">
            Enter a new password to access your dashboard. Passwords must be at least 8 characters long.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="new_password">
              New password
            </label>
            <div className="relative">
              <input
                id="new_password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.newPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-14 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-blue-600 hover:text-blue-700"
                aria-pressed={showPassword}
              >
                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11.25a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="confirm_password">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-14 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-blue-600 hover:text-blue-700"
                aria-pressed={showPassword}
              >
                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11.25a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Updating…' : 'Reset Password'}
          </button>
        </form>

        {toast ? (
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        ) : null}
      </div>
    </div>
  );
}
