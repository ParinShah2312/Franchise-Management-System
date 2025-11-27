import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const session = await login(formState.email, formState.password);

      if (session.mustResetPassword) {
        navigate('/reset-password', { replace: true });
        return;
      }

      const role = (session.role || '').toUpperCase();

      if (role === 'FRANCHISOR') {
        navigate('/admin', { replace: true });
      } else if (role === 'BRANCH_OWNER') {
        navigate('/dashboard', { replace: true });
      } else if (role === 'MANAGER') {
        navigate('/manager', { replace: true });
      } else if (role === 'STAFF') {
        navigate('/staff', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Back to operations
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Sign in to your Relay workspace
          </h1>
          <p className="text-lg text-gray-600">
            Access franchise insights, track branch performance, and keep your teams aligned from a single dashboard.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="card">
              <p className="text-sm font-semibold text-gray-900">Centralized dashboards</p>
              <p className="mt-2 text-sm text-gray-600">Stay informed on branch health and staffing needs in real time.</p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-gray-900">Role-based workflows</p>
              <p className="mt-2 text-sm text-gray-600">Tools tailored for franchisors, owners, managers, and staff.</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="card p-10 shadow-xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-10.5M15 9h6v6" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
                <p className="text-sm text-gray-500">Sign in to continue managing your network.</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="label" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="input-field pl-12"
                    placeholder="you@relay.com"
                    value={formState.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pl-12 pr-12"
                    placeholder="••••••••"
                    value={formState.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-primary hover:text-primary-hover"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              New to Relay?{' '}
              <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
                Start an application
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
