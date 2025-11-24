import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api';

const ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

const initialState = {
  name: '',
  email: '',
  password: '',
  franchise_id: '',
  position: '',
  contact: '',
};

export default function RegisterStaff() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [franchises, setFranchises] = useState([]);
  const [loadingFranchises, setLoadingFranchises] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadFranchises = async () => {
      setLoadingFranchises(true);
      try {
        const data = await api.get('/franchises/active-locations');
        if (isMounted) {
          setFranchises(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load active franchise locations.');
        }
      } finally {
        if (isMounted) {
          setLoadingFranchises(false);
        }
      }
    };

    loadFranchises();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailLower = formState.email.toLowerCase();
    if (!emailPattern.test(formState.email)) {
      errors.email = 'Invalid email format.';
    } else if (emailLower.includes('@gamil.com')) {
      errors.email = 'Did you mean @gmail.com? Please check for typos.';
    } else {
      const domain = emailLower.split('@')[1] || '';
      if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
        errors.email = 'Please use a standard email provider (Gmail, Yahoo, Outlook, etc).';
      }
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordPattern.test(formState.password)) {
      errors.password = 'Password must be 8+ chars with 1 uppercase, 1 lowercase, and 1 number.';
    }

    const contactPattern = /^\d{10}$/;
    if (!contactPattern.test(formState.contact.trim())) {
      errors.contact = 'Contact number must be exactly 10 digits.';
    }

    if (!formState.position.trim()) {
      errors.position = 'Position is required.';
    }

    if (!formState.franchise_id) {
      errors.franchise_id = 'Select a franchise to continue.';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    try {
      await api.post('/auth/register-staff', {
        name: formState.name,
        email: formState.email,
        password: formState.password,
        franchise_id: Number(formState.franchise_id),
        position: formState.position,
        contact: formState.contact,
      });

      setSuccess('Registration successful! You can now log in once your manager confirms.');
      setFormState(initialState);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err) {
      setError(err.message || 'Unable to register as staff.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Join a Franchise Team</h1>
            <p className="text-gray-500">Create your staff account to access daily tools</p>
          </div>
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            Back to login
          </Link>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Full Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Jordan Smith"
                value={formState.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email*
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                value={formState.email}
                onChange={handleChange}
              />
              {formErrors.email ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password*
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-14"
                  placeholder="Create a secure password"
                  value={formState.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {formErrors.password ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="franchise_id">
                Franchise*
              </label>
              <select
                id="franchise_id"
                name="franchise_id"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formState.franchise_id}
                onChange={handleChange}
                disabled={loadingFranchises}
              >
                <option value="">
                  {loadingFranchises ? 'Loading locations…' : 'Select your franchise location'}
                </option>
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {`${franchise.name || 'Franchise'}${franchise.location ? ` - ${franchise.location}` : ''}`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Ask your manager for confirmation before selecting a franchise.
              </p>
              {formErrors.franchise_id ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.franchise_id}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="position">
                Position*
              </label>
              <input
                id="position"
                name="position"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Barista, Shift Lead, etc."
                value={formState.position}
                onChange={handleChange}
              />
              {formErrors.position ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.position}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact">
                Contact Number*
              </label>
              <input
                id="contact"
                name="contact"
                type="tel"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="5551234567"
                value={formState.contact}
                maxLength={10}
                onChange={(event) => {
                  const sanitized = event.target.value.replace(/\D/g, '');
                  setFormState((prev) => ({ ...prev, contact: sanitized }));
                }}
              />
              {formErrors.contact ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.contact}</p>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          ) : null}

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create Staff Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
