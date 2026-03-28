import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api';
import {
  AccountInfoSection,
  PersonalInfoSection,
  FranchiseDetailsSection,
  BusinessInfoSection,
} from '../components/register';
import { isValidEmail, isValidPassword, isValidPhone, sanitizePhone } from '../utils';

const initialState = {
  email: '',
  password: '',
  name: '',
  phone: '',
  franchise_id: '',
  proposed_location: '',
  investment_capacity: '',
  business_experience: '',
  reason: '',
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

  const handlePhoneChange = (event) => {
    setFormState((prev) => ({ ...prev, phone: sanitizePhone(event.target.value) }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setApplicationFile(file);
  };

  const validateForm = () => {
    const errors = {};

    if (!isValidEmail(formState.email)) {
      errors.email = 'Invalid email format.';
    }

    if (!isValidPassword(formState.password)) {
      errors.password = 'Password must be 8+ chars with 1 uppercase, 1 lowercase, and 1 number.';
    }

    if (!isValidPhone(formState.phone)) {
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

    if (!formState.proposed_location.trim()) {
      errors.proposed_location = 'Proposed location is required.';
    }

    if (!applicationFile) {
      errors.application_file = 'Upload your supporting document (PDF, JPG, or PNG).';
    }

    const investmentValue = formState.investment_capacity.trim();
    if (!investmentValue) {
      errors.investment_capacity = 'Provide your estimated investment capacity.';
    } else if (Number.isNaN(Number(investmentValue)) || Number(investmentValue) <= 0) {
      errors.investment_capacity = 'Investment capacity must be a positive number.';
    }

    if (!formState.business_experience.trim()) {
      errors.business_experience = 'Please describe your business experience.';
    }

    if (!formState.reason.trim()) {
      errors.reason = 'Please share your reason for opening a franchise.';
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
      submission.append('proposed_location', formState.proposed_location.trim());
      submission.append('investment_capacity', formState.investment_capacity.trim());
      submission.append('business_experience', formState.business_experience.trim());
      submission.append('reason', formState.reason.trim());

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
          <AccountInfoSection
            email={formState.email}
            password={formState.password}
            showPassword={showPassword}
            formErrors={formErrors}
            onChange={handleChange}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
          />

          <PersonalInfoSection
            name={formState.name}
            phone={formState.phone}
            formErrors={formErrors}
            onChange={handleChange}
            onPhoneChange={handlePhoneChange}
          />

          <FranchiseDetailsSection
            franchiseId={formState.franchise_id}
            proposedLocation={formState.proposed_location}
            brandOptions={brandOptions}
            loadingBrands={loadingBrands}
            brandsError={brandsError}
            applicationFile={applicationFile}
            formErrors={formErrors}
            onChange={handleChange}
            onFileChange={handleFileChange}
            fileInputRef={fileInputRef}
          />

          <BusinessInfoSection
            investmentCapacity={formState.investment_capacity}
            businessExperience={formState.business_experience}
            reason={formState.reason}
            formErrors={formErrors}
            onChange={handleChange}
          />

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
