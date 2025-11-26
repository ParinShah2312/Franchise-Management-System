import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api';

const initialState = {
  organization_name: '',
  contact_person: '',
  email: '',
  phone: '',
  password: '',
};

export default function RegisterFranchisor() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formState.organization_name.trim()) {
      errors.organization_name = 'Organization name is required.';
    }

    if (!formState.contact_person.trim()) {
      errors.contact_person = 'Contact person name is required.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailLower = formState.email.toLowerCase();
    if (!emailPattern.test(formState.email)) {
      errors.email = 'Invalid email format.';
    } else if (emailLower.includes('@gamil.com')) {
      errors.email = 'Did you mean @gmail.com? Please check for typos.';
    }

    const phoneDigits = formState.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits.';
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(formState.password)) {
      errors.password = 'Password must be 8+ chars with 1 uppercase, 1 lowercase, and 1 number.';
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
      await api.post('/auth/register-franchisor', {
        organization_name: formState.organization_name.trim(),
        contact_person: formState.contact_person.trim(),
        email: formState.email.trim().toLowerCase(),
        phone: formState.phone.replace(/\D/g, ''),
        password: formState.password,
      });

      setSuccess('Registration successful! You can now log in to manage your brand.');
      setFormState(initialState);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err) {
      setError(err?.message || 'Unable to register franchisor at this time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Start Your Franchise Brand</h1>
            <p className="text-gray-500 max-w-md">
              Create your franchisor account to configure products, onboard branches, and manage your
              franchise network.
            </p>
          </div>
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            Back to login
          </Link>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="organization_name">
                Organization Name*
              </label>
              <input
                id="organization_name"
                name="organization_name"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Relay Coffee Brands"
                value={formState.organization_name}
                onChange={handleChange}
              />
              {formErrors.organization_name ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.organization_name}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact_person">
                Contact Person*
              </label>
              <input
                id="contact_person"
                name="contact_person"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Jordan Smith"
                value={formState.contact_person}
                onChange={handleChange}
              />
              {formErrors.contact_person ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.contact_person}</p>
              ) : null}
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
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                Phone Number*
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="5551234567"
                value={formState.phone}
                onChange={(event) => {
                  const sanitized = event.target.value.replace(/\D/g, '');
                  setFormState((prev) => ({ ...prev, phone: sanitized }));
                }}
                maxLength={10}
              />
              {formErrors.phone ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
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
            {submitting ? 'Creating account…' : 'Create Franchisor Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
