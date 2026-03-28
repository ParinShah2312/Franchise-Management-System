import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api';
import { ContactInfoSection, OrgInfoSection } from '../components/register';
import { useAuth } from '../context/AuthContext';
import { hasEmailTypo, isValidEmail, isValidPassword, isValidPhone, sanitizePhone } from '../utils';

const initialState = {
  organization_name: '',
  contact_person: '',
  email: '',
  phone: '',
  password: '',
};

export default function RegisterFranchisor() {
  const navigate = useNavigate();
  const { login } = useAuth();
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

  const handlePhoneChange = (event) => {
    setFormState((prev) => ({ ...prev, phone: sanitizePhone(event.target.value) }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formState.organization_name.trim()) {
      errors.organization_name = 'Organization name is required.';
    }

    if (!formState.contact_person.trim()) {
      errors.contact_person = 'Contact person name is required.';
    }

    if (!isValidEmail(formState.email)) {
      errors.email = 'Invalid email format.';
    } else if (hasEmailTypo(formState.email)) {
      errors.email = 'Did you mean @gmail.com? Please check for typos.';
    }

    if (!isValidPhone(formState.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits.';
    }

    if (!isValidPassword(formState.password)) {
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
        phone: sanitizePhone(formState.phone),
        password: formState.password,
      });

      try {
        await login(formState.email.trim().toLowerCase(), formState.password);
        setSuccess('Registration successful! Redirecting to your dashboard...');
        setFormState(initialState);
        setTimeout(() => navigate('/admin', { replace: true }), 1000);
      } catch (loginErr) {
        setSuccess('Registration successful! Please log in.');
        setFormState(initialState);
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
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
            <OrgInfoSection
              organizationName={formState.organization_name}
              contactPerson={formState.contact_person}
              formErrors={formErrors}
              onChange={handleChange}
            />

            <ContactInfoSection
              email={formState.email}
              phone={formState.phone}
              password={formState.password}
              showPassword={showPassword}
              formErrors={formErrors}
              onChange={handleChange}
              onPhoneChange={handlePhoneChange}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
            />
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
