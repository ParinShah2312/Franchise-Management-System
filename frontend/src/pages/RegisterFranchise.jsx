import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api';

const initialState = {
  email: '',
  password: '',
  name: '',
  phone: '',
  franchise_id: '',
  location: '',
  property_size: '',
  investment_capacity: '',
  business_experience: '',
  reason_for_franchise: '',
  expected_opening_date: '',
};

export default function RegisterFranchise() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [brandsError, setBrandsError] = useState('');
  const [applicationFile, setApplicationFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBrands = async () => {
      setLoadingBrands(true);
      setBrandsError('');

      try {
        const brandsResponse = await api.get('/franchises/brands');
        if (!isMounted) return;

        const normalizedBrands = Array.isArray(brandsResponse)
          ? brandsResponse.filter((brand) => brand && brand.id && brand.name)
          : [];

        if (normalizedBrands.length === 0) {
          setBrandsError('No franchise brands are currently available. Please contact the admin team.');
        }

        setBrandOptions(normalizedBrands);
      } catch (err) {
        if (!isMounted) return;
        setBrandOptions([]);
        setBrandsError(err.message || 'Unable to load franchise brands.');
      } finally {
        if (isMounted) {
          setLoadingBrands(false);
        }
      }
    };

    fetchBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setApplicationFile(file);
  };

  const validateForm = () => {
    const errors = {};

    const emailLower = formState.email.toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formState.email)) {
      errors.email = 'Invalid email format.';
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordPattern.test(formState.password)) {
      errors.password = 'Password must be 8+ chars with 1 uppercase, 1 lowercase, and 1 number.';
    }

    const phoneDigits = formState.phone.trim();
    if (!/^\d{10}$/.test(phoneDigits)) {
      errors.phone = 'Contact number must be exactly 10 digits.';
    }

    if (!formState.name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!formState.franchise_id) {
      errors.franchise_id = 'Select a franchise brand.';
    } else if (
      !loadingBrands &&
      brandOptions.length > 0 &&
      !brandOptions.some((brand) => String(brand.id) === String(formState.franchise_id))
    ) {
      errors.franchise_id = 'Please choose a valid brand option.';
    }

    if (!formState.location.trim()) {
      errors.location = 'Location is required.';
    }

    if (!applicationFile) {
      errors.application_file = 'Upload your supporting document (PDF, JPG, or PNG).';
    }

    if (!formState.expected_opening_date) {
      errors.expected_opening_date = 'Expected opening date is required.';
    }

    if (!formState.property_size) {
      errors.property_size = 'Select a property size.';
    }

    if (!formState.investment_capacity) {
      errors.investment_capacity = 'Select an investment capacity.';
    }

    if (!formState.business_experience.trim()) {
      errors.business_experience = 'Please describe your business experience.';
    }

    if (!formState.reason_for_franchise.trim()) {
      errors.reason_for_franchise = 'Please share your reason for opening a franchise.';
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

    setSubmitting(true);
    setFormErrors({});

    try {
      const submission = new FormData();
      submission.append('email', formState.email.trim());
      submission.append('password', formState.password);
      submission.append('name', formState.name.trim());
      submission.append('phone', formState.phone.trim());
      submission.append('franchise_id', String(formState.franchise_id));
      submission.append('proposed_location', formState.location.trim());
      submission.append('property_size', formState.property_size);
      submission.append('investment_capacity', formState.investment_capacity);
      submission.append('business_experience', formState.business_experience.trim());
      submission.append('reason_for_franchise', formState.reason_for_franchise.trim());
      submission.append('expected_opening_date', formState.expected_opening_date);

      if (applicationFile) {
        submission.append('application_file', applicationFile);
      }

      await api.post('/auth/register-franchisee', submission);

      setSuccess('Registration successful! Await admin approval.');
      setFormState(initialState);
      setApplicationFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        setSuccess('');
        navigate('/', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Unable to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Join Relay</h1>
            <p className="text-gray-500">Complete your franchise application</p>
          </div>
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            Back to login
          </Link>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="your.email@example.com"
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
                    placeholder="Create a strong password"
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
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h2>
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
                  placeholder="John Doe"
                  value={formState.name}
                  onChange={handleChange}
                />
                {formErrors.name ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
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
                  maxLength={10}
                  onChange={(event) => {
                    const sanitized = event.target.value.replace(/\D/g, '');
                    setFormState((prev) => ({ ...prev, phone: sanitized }));
                  }}
                />
                {formErrors.phone ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Franchise Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="franchise_id">
                  Select Franchise Brand*
                </label>
                <select
                  id="franchise_id"
                  name="franchise_id"
                  required
                  disabled={loadingBrands || brandOptions.length === 0}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formState.franchise_id}
                  onChange={handleChange}
                >
                  <option value="">{loadingBrands ? 'Loading brands…' : 'Select a franchise brand'}</option>
                  {brandOptions.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {brandsError ? <p className="mt-1 text-xs text-amber-600">{brandsError}</p> : null}
                {formErrors.franchise_id ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.franchise_id}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">
                  Proposed Location (City, State)*
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Austin, TX"
                  value={formState.location}
                  onChange={handleChange}
                />
                {formErrors.location ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.location}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expected_opening_date">
                  Expected Opening Date*
                </label>
                <input
                  id="expected_opening_date"
                  name="expected_opening_date"
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formState.expected_opening_date}
                  onChange={handleChange}
                />
                {formErrors.expected_opening_date ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.expected_opening_date}</p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="application_file">
                  Application Document (PDF/JPG/PNG)*
                </label>
                <input
                  id="application_file"
                  name="application_file"
                  type="file"
                  required
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleFileChange}
                />
                <p className="mt-1 text-xs text-gray-500">Attach your government ID or business plan supporting this expansion request.</p>
                {formErrors.application_file ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.application_file}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property_size">
                  Property Size*
                </label>
                <select
                  id="property_size"
                  name="property_size"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formState.property_size}
                  onChange={handleChange}
                >
                  <option value="">Select property size</option>
                  <option value="Less than 1000 sq ft">Less than 1000 sq ft</option>
                  <option value="1000 - 2000 sq ft">1000 - 2000 sq ft</option>
                  <option value="2000 - 3000 sq ft">2000 - 3000 sq ft</option>
                  <option value="3000 - 5000 sq ft">3000 - 5000 sq ft</option>
                  <option value="More than 5000 sq ft">More than 5000 sq ft</option>
                </select>
                {formErrors.property_size ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.property_size}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="investment_capacity">
                  Investment Capacity*
                </label>
                <select
                  id="investment_capacity"
                  name="investment_capacity"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formState.investment_capacity}
                  onChange={handleChange}
                >
                  <option value="">Select investment capacity</option>
                  <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                  <option value="$100,000 - $200,000">$100,000 - $200,000</option>
                  <option value="$200,000 - $500,000">$200,000 - $500,000</option>
                  <option value="$500,000 - $1,000,000">$500,000 - $1,000,000</option>
                  <option value="More than $1,000,000">More than $1,000,000</option>
                </select>
                {formErrors.investment_capacity ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.investment_capacity}</p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="business_experience">
                  Business Experience*
                </label>
                <textarea
                  id="business_experience"
                  name="business_experience"
                  required
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your relevant business experience"
                  value={formState.business_experience}
                  onChange={handleChange}
                />
                {formErrors.business_experience ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.business_experience}</p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reason_for_franchise">
                  Why do you want to open a Relay franchise?*
                </label>
                <textarea
                  id="reason_for_franchise"
                  name="reason_for_franchise"
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about your motivation and goals"
                  value={formState.reason_for_franchise}
                  onChange={handleChange}
                />
                {formErrors.reason_for_franchise ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.reason_for_franchise}</p>
                ) : null}
              </div>
            </div>
          </section>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
          >
            {submitting ? 'Submitting application…' : 'Submit Franchise Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
