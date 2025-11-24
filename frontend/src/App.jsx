import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api';

// Toast Notification Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl animate-slide-in-right ${
      type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } text-white font-semibold`}>
      {message}
    </div>
  );
}

// Login Component
function Login({ onLoginSuccess, onNavigateToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all hover:scale-105 duration-300">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2 tracking-tight">Relay</h1>
          <p className="text-gray-500 text-sm">Franchise Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="admin@relay.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Apply here
            </button>
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Demo: admin@relay.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

// Registration Component
function Registration({ onNavigateToLogin, onRegistrationSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    franchise_name: '',
    owner_name: '',
    location: '',
    phone: '',
    property_size: '',
    investment_capacity: '',
    business_experience: '',
    reason_for_franchise: '',
    expected_opening_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onRegistrationSuccess();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Join Relay</h1>
          <p className="text-gray-500 text-sm">Complete your franchise application</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Information */}
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Create a strong password"
                  required
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="+1-555-0123"
                  required
                />
              </div>
            </div>
          </div>

          {/* Franchise Details */}
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Franchise Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Franchise Name *</label>
                <input
                  type="text"
                  value={formData.franchise_name}
                  onChange={(e) => setFormData({ ...formData, franchise_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="My Coffee Shop"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (City, State) *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Austin, TX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Opening Date *</label>
                <input
                  type="date"
                  value={formData.expected_opening_date}
                  onChange={(e) => setFormData({ ...formData, expected_opening_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Size *</label>
                <select
                  value={formData.property_size}
                  onChange={(e) => setFormData({ ...formData, property_size: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="">Select property size</option>
                  <option value="Less than 1000 sq ft">Less than 1000 sq ft</option>
                  <option value="1000 - 2000 sq ft">1000 - 2000 sq ft</option>
                  <option value="2000 - 3000 sq ft">2000 - 3000 sq ft</option>
                  <option value="3000 - 5000 sq ft">3000 - 5000 sq ft</option>
                  <option value="More than 5000 sq ft">More than 5000 sq ft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investment Capacity *</label>
                <select
                  value={formData.investment_capacity}
                  onChange={(e) => setFormData({ ...formData, investment_capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="">Select investment capacity</option>
                  <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                  <option value="$100,000 - $200,000">$100,000 - $200,000</option>
                  <option value="$200,000 - $500,000">$200,000 - $500,000</option>
                  <option value="$500,000 - $1,000,000">$500,000 - $1,000,000</option>
                  <option value="More than $1,000,000">More than $1,000,000</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Experience *</label>
              <textarea
                value={formData.business_experience}
                onChange={(e) => setFormData({ ...formData, business_experience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                rows="3"
                placeholder="Describe your relevant business experience (e.g., years in industry, previous businesses owned, management experience)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Why do you want to open a Relay franchise? *</label>
              <textarea
                value={formData.reason_for_franchise}
                onChange={(e) => setFormData({ ...formData, reason_for_franchise: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                rows="4"
                placeholder="Tell us about your motivation, goals, and why Relay is the right fit for you"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting Application...' : 'Submit Franchise Application'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Franchise Card Component  
function FranchiseCard({ franchise, onApprove, onEdit, onDelete, onViewDetails, isAdmin }) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    await onApprove(franchise.franchise_id);
    setIsApproving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800">{franchise.franchise_name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            franchise.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {franchise.status === 'active' ? '✓ Active' : '⏳ Pending'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm">{franchise.owner_name}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">{franchise.location}</span>
        </div>
        {franchise.phone && (
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm">{franchise.phone}</span>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="space-y-2">
          {franchise.status === 'pending' && (
            <>
              <button
                onClick={() => onViewDetails(franchise)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-200"
              >
                📋 Review Application
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? 'Approving...' : '✓ Approve Franchise'}
              </button>
            </>
          )}
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(franchise)}
              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 rounded-lg transition-all duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(franchise)}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg transition-all duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Franchise Modal Component
function AddFranchiseModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    franchise_name: '',
    owner_name: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onAdd(formData);
      setFormData({ franchise_name: '', owner_name: '', location: '' });
      onClose();
    } catch (err) {
      setError('Failed to add franchise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all scale-100 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Franchise</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Franchise Name</label>
            <input
              type="text"
              value={formData.franchise_name}
              onChange={(e) => setFormData({ ...formData, franchise_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="e.g., Relay Coffee Downtown"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="e.g., Jane Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="e.g., Seattle, WA"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Franchise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Franchise Modal Component
function EditFranchiseModal({ isOpen, onClose, franchise, onUpdate }) {
  const [formData, setFormData] = useState({
    franchise_name: franchise?.franchise_name || '',
    owner_name: franchise?.owner_name || '',
    location: franchise?.location || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (franchise) {
      setFormData({
        franchise_name: franchise.franchise_name,
        owner_name: franchise.owner_name,
        location: franchise.location,
      });
    }
  }, [franchise]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onUpdate(franchise.franchise_id, formData);
      onClose();
    } catch (err) {
      setError('Failed to update franchise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !franchise) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Franchise</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Franchise Name</label>
            <input
              type="text"
              value={formData.franchise_name}
              onChange={(e) => setFormData({ ...formData, franchise_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Application Details Modal Component
function ViewApplicationModal({ isOpen, onClose, franchise, onApprove }) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    await onApprove(franchise.franchise_id);
    setIsApproving(false);
    onClose();
  };

  if (!isOpen || !franchise) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Franchise Application Review</h2>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
              franchise.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {franchise.status === 'active' ? '✓ Active' : '⏳ Pending Approval'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Franchise Information */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📍 Franchise Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Franchise Name</p>
                <p className="text-lg text-gray-900 font-semibold">{franchise.franchise_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Location</p>
                <p className="text-lg text-gray-900">{franchise.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Expected Opening</p>
                <p className="text-lg text-gray-900">{franchise.expected_opening_date ? new Date(franchise.expected_opening_date).toLocaleDateString() : 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">👤 Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Full Name</p>
                <p className="text-lg text-gray-900">{franchise.owner_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                <p className="text-lg text-gray-900">{franchise.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Business Capacity */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">💼 Business Capacity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Property Size</p>
                <p className="text-lg text-gray-900">{franchise.property_size || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Investment Capacity</p>
                <p className="text-lg text-gray-900 font-semibold">{franchise.investment_capacity || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Business Experience */}
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">🎓 Business Experience</h3>
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{franchise.business_experience || 'Not provided'}</p>
          </div>

          {/* Reason for Franchise */}
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">💡 Why They Want This Franchise</h3>
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{franchise.reason_for_franchise || 'Not provided'}</p>
          </div>

          {/* Application Date */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Applied on:</strong> {new Date(franchise.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6 mt-6 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all duration-200"
          >
            Close
          </button>
          {franchise.status === 'pending' && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving ? 'Approving...' : '✓ Approve Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmModal({ isOpen, onClose, franchise, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onConfirm(franchise.franchise_id);
    setIsDeleting(false);
    onClose();
  };

  if (!isOpen || !franchise) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Delete Franchise?</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{franchise.franchise_name}</strong>? This action cannot be undone.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard({ user, onLogout }) {
  const [franchises, setFranchises] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editFranchise, setEditFranchise] = useState(null);
  const [deleteFranchise, setDeleteFranchise] = useState(null);
  const [viewFranchise, setViewFranchise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchFranchises();
    fetchMetrics();
    fetchRecentSales();
  }, []);

  const fetchFranchises = async () => {
    try {
      const response = await fetch(`${API_URL}/franchises`);
      if (response.ok) {
        const data = await response.json();
        setFranchises(data);
      }
    } catch (err) {
      showToast('Failed to fetch franchises', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics');
    }
  };

  const fetchRecentSales = async () => {
    try {
      const response = await fetch(`${API_URL}/sales/recent`);
      if (response.ok) {
        const data = await response.json();
        setRecentSales(data);
      }
    } catch (err) {
      console.error('Failed to fetch recent sales');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleAddFranchise = async (franchiseData) => {
    const response = await fetch(`${API_URL}/franchises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(franchiseData),
    });

    if (response.ok) {
      const newFranchise = await response.json();
      setFranchises([newFranchise, ...franchises]);
      showToast('Franchise added successfully!', 'success');
      fetchMetrics();
    } else {
      throw new Error('Failed to add franchise');
    }
  };

  const handleUpdateFranchise = async (franchiseId, franchiseData) => {
    const response = await fetch(`${API_URL}/franchises/${franchiseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(franchiseData),
    });

    if (response.ok) {
      const updatedFranchise = await response.json();
      setFranchises(franchises.map((f) => f.franchise_id === franchiseId ? updatedFranchise : f));
      showToast('Franchise updated successfully!', 'success');
      setEditFranchise(null);
    } else {
      throw new Error('Failed to update franchise');
    }
  };

  const handleDeleteFranchise = async (franchiseId) => {
    const response = await fetch(`${API_URL}/franchises/${franchiseId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setFranchises(franchises.filter((f) => f.franchise_id !== franchiseId));
      showToast('Franchise deleted successfully!', 'success');
      fetchMetrics();
    }
  };

  const handleApproveFranchise = async (franchiseId) => {
    const response = await fetch(`${API_URL}/franchises/${franchiseId}/approve`, {
      method: 'PUT',
    });

    if (response.ok) {
      const updatedFranchise = await response.json();
      setFranchises(franchises.map((f) => f.franchise_id === franchiseId ? updatedFranchise : f));
      showToast('Franchise approved successfully!', 'success');
      fetchMetrics();
      fetchRecentSales();
    }
  };

  const filteredFranchises = franchises.filter((f) => {
    const matchesSearch = f.franchise_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Relay</h1>
              <p className="text-gray-500 text-sm mt-1">Admin Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button onClick={onLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Metrics */}
        {metrics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">System Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total System Revenue</p>
                    <p className="text-4xl font-bold mt-2">${metrics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Monthly Revenue</p>
                    <p className="text-4xl font-bold mt-2">${metrics.monthly_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Franchise Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Franchises</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{metrics?.total_franchises || franchises.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{metrics?.active_franchises || 0}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{metrics?.pending_franchises || 0}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sales Activity */}
        {recentSales.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Recent Sales Activity</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Franchise</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale, index) => (
                      <tr 
                        key={sale.sale_id} 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{sale.franchise_name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{sale.owner_name}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{sale.location}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-green-600">
                            ${parseFloat(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 text-sm">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-500 text-xs">
                          {new Date(sale.created_at).toLocaleTimeString()}
                          {index === 0 && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Latest</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing last {recentSales.length} sales transactions
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search franchises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Franchise</span>
          </button>
        </div>

        {/* Franchises Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading franchises...</p>
          </div>
        ) : filteredFranchises.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 text-lg">No franchises found</p>
            <p className="text-gray-400 text-sm mt-2">{searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Click "Add Franchise" to get started'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFranchises.map((franchise) => (
              <FranchiseCard
                key={franchise.franchise_id}
                franchise={franchise}
                onApprove={handleApproveFranchise}
                onEdit={setEditFranchise}
                onDelete={setDeleteFranchise}
                onViewDetails={setViewFranchise}
                isAdmin={true}
              />
            ))}
          </div>
        )}
      </main>

      <AddFranchiseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddFranchise} />
      <EditFranchiseModal isOpen={!!editFranchise} onClose={() => setEditFranchise(null)} franchise={editFranchise} onUpdate={handleUpdateFranchise} />
      <DeleteConfirmModal isOpen={!!deleteFranchise} onClose={() => setDeleteFranchise(null)} franchise={deleteFranchise} onConfirm={handleDeleteFranchise} />
      <ViewApplicationModal isOpen={!!viewFranchise} onClose={() => setViewFranchise(null)} franchise={viewFranchise} onApprove={handleApproveFranchise} />
    </div>
  );
}

// Franchisee Dashboard Component
function FranchiseeDashboard({ user, franchise, onLogout }) {
  const [sales, setSales] = useState([]);
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    total_amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (franchise?.franchise_id) {
      fetchSales();
    }
  }, [franchise]);

  // Show loading while franchise data is being fetched
  if (!franchise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your franchise details...</p>
        </div>
      </div>
    );
  }

  const fetchSales = async () => {
    try {
      const response = await fetch(`${API_URL}/sales/${franchise.franchise_id}`);
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Failed to fetch sales');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchise_id: franchise.franchise_id,
          sale_date: formData.sale_date,
          total_amount: parseFloat(formData.total_amount),
        }),
      });

      if (response.ok) {
        setToast({ message: 'Sales data submitted successfully!', type: 'success' });
        setFormData({ sale_date: new Date().toISOString().split('T')[0], total_amount: '' });
        fetchSales();
      } else {
        setToast({ message: 'Failed to submit sales data', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Connection error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);

  if (franchise?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="bg-yellow-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Pending</h2>
          <p className="text-gray-600 mb-6">
            Your franchise application is awaiting admin approval. You'll receive access once approved.
          </p>
          <button onClick={onLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition-all duration-200 font-medium">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Relay</h1>
              <p className="text-gray-500 text-sm mt-1">My Franchise</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button onClick={onLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Franchise Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Franchise Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Franchise Name</p>
              <p className="text-lg font-semibold text-gray-800">{franchise.franchise_name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Owner</p>
              <p className="text-lg font-semibold text-gray-800">{franchise.owner_name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Location</p>
              <p className="text-lg font-semibold text-gray-800">{franchise.location}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enter Sales Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Enter Daily Sales</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Date</label>
                <input
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Sales'}
              </button>
            </form>
          </div>

          {/* Sales Summary */}
          <div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white mb-6">
              <p className="text-green-100 text-sm font-medium">Total Sales</p>
              <p className="text-4xl font-bold mt-2">${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-green-100 text-sm mt-2">{sales.length} transactions</p>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Sales</h3>
              {sales.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No sales data yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sales.map((sale) => (
                    <div key={sale.sale_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">${parseFloat(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-gray-500">{new Date(sale.sale_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [franchise, setFranchise] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'franchisee' && userData.franchise_id) {
      fetchFranchise(userData.franchise_id);
    }
  };

  const fetchFranchise = async (franchiseId) => {
    try {
      const response = await fetch(`${API_URL}/franchises`);
      if (response.ok) {
        const data = await response.json();
        const userFranchise = data.find(f => f.franchise_id === franchiseId);
        setFranchise(userFranchise);
      }
    } catch (err) {
      console.error('Failed to fetch franchise');
    }
  };

  const handleRegistrationSuccess = () => {
    setToast({ message: 'Registration successful! Awaiting admin approval.', type: 'success' });
    setTimeout(() => setCurrentPage('login'), 2000);
  };

  const handleLogout = () => {
    setUser(null);
    setFranchise(null);
    setCurrentPage('login');
  };

  const [toast, setToast] = useState(null);

  return (
    <div className="font-['Inter',sans-serif]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {!user ? (
        currentPage === 'login' ? (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            onNavigateToRegister={() => setCurrentPage('register')} 
          />
        ) : (
          <Registration 
            onNavigateToLogin={() => setCurrentPage('login')} 
            onRegistrationSuccess={handleRegistrationSuccess}
          />
        )
      ) : user.role === 'admin' ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <FranchiseeDashboard user={user} franchise={franchise} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
