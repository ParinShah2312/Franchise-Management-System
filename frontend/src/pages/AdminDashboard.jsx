import { useEffect, useState } from 'react';

import { api, API_ORIGIN } from '../api';
import { useAuth } from '../context/AuthContext';

function FranchiseCard({ franchise, onApprove, onReject, onReview }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(franchise.id);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onReject(franchise.id);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {franchise.franchise_name || franchise.name || 'Untitled Franchise'}
          </h3>
          <p className="text-gray-500">{franchise.location}</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
        <div>
          <span className="font-medium">Owner:</span> {franchise.owner_name || '—'}
        </div>
        <div>
          <span className="font-medium">Phone:</span> {franchise.phone || '—'}
        </div>
        <div>
          <span className="font-medium">Property Size:</span> {franchise.property_size || '—'}
        </div>
        <div>
          <span className="font-medium">Investment Capacity:</span> {franchise.investment_capacity || '—'}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onReview(franchise)}
          className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition"
        >
          Review Application
        </button>
        {franchise.status === 'pending' ? (
          <>
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition disabled:opacity-60"
            >
              {approving ? 'Approving…' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={rejecting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition disabled:opacity-60"
            >
              {rejecting ? 'Rejecting…' : 'Reject'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ReviewModal({ franchise, onClose, onApprove, onReject, formatDate }) {
  if (!franchise) return null;

  const documentUrl = franchise.application_file ? `${API_ORIGIN}/static/${franchise.application_file}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Franchise Application</h3>
            <p className="text-sm text-gray-500">Review supporting details before approving the expansion.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close review modal"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <section>
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <span className="font-medium text-gray-900">Brand:</span> {franchise.franchise_name || '—'}
              </div>
              <div>
                <span className="font-medium text-gray-900">Proposed Location:</span> {franchise.location || '—'}
              </div>
              <div>
                <span className="font-medium text-gray-900">Applicant:</span> {franchise.owner_name || '—'}
              </div>
              <div>
                <span className="font-medium text-gray-900">Contact:</span> {franchise.phone || '—'}
              </div>
              <div>
                <span className="font-medium text-gray-900">Expected Opening:</span> {formatDate(franchise.expected_opening_date)}
              </div>
              <div>
                <span className="font-medium text-gray-900">Investment Capacity:</span> {franchise.investment_capacity || '—'}
              </div>
              <div>
                <span className="font-medium text-gray-900">Property Size:</span> {franchise.property_size || '—'}
              </div>
              <div>
                <span className="font-medium text-gray-900">Status:</span> {franchise.status}
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Business Narrative</h4>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-900 mb-1">Business Experience</p>
                <p className="whitespace-pre-line bg-gray-50 border border-gray-200 rounded-lg p-3">
                  {franchise.business_experience || 'Not provided.'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Motivation</p>
                <p className="whitespace-pre-line bg-gray-50 border border-gray-200 rounded-lg p-3">
                  {franchise.reason_for_franchise || 'Not provided.'}
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Supporting Document</h4>
              {documentUrl ? (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg border border-blue-200 hover:bg-blue-100"
                >
                  📄 View Application Document
                </a>
              ) : (
                <p className="text-sm text-gray-500">No document uploaded.</p>
              )}
            </div>
            {franchise.status === 'pending' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onReject(franchise.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(franchise.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                >
                  Approve
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [modalFranchise, setModalFranchise] = useState(null);

  const formatCurrency = (value) => {
    const numericValue = typeof value === 'number' ? value : Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '—';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(parsed);
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [franchiseData, metricsData, recentSalesData] = await Promise.all([
        api.get('/franchises'),
        api.get('/dashboard/metrics'),
        api.get('/dashboard/recent-sales'),
      ]);

      setFranchises(franchiseData);
      setMetrics(metricsData);
      setRecentSales(Array.isArray(recentSalesData) ? recentSalesData : []);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleApprove = async (franchiseId) => {
    try {
      await api.put(`/franchises/${franchiseId}/approve`);
      await loadDashboard();
      setModalFranchise((prev) => (prev && prev.id === franchiseId ? null : prev));
    } catch (err) {
      setError(err.message || 'Failed to approve franchise.');
    }
  };

  const handleReject = async (franchiseId) => {
    try {
      await api.put(`/franchises/${franchiseId}/reject`);
      await loadDashboard();
      setModalFranchise((prev) => (prev && prev.id === franchiseId ? null : prev));
    } catch (err) {
      setError(err.message || 'Failed to reject franchise.');
    }
  };

  const handleReview = (franchise) => {
    setModalFranchise(franchise);
  };

  const closeModal = () => setModalFranchise(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Manage franchises across the Relay network</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {error ? (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-gray-500">Loading dashboard…</p>
          </div>
        ) : (
          <div className="space-y-10">
            {metrics ? (
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-6 shadow-sm">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                    Total Revenue
                  </p>
                  <p className="mt-3 text-3xl font-bold text-green-900">{formatCurrency(metrics.total_revenue)}</p>
                  <p className="mt-1 text-xs text-green-700/80">Lifetime network sales</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                    Monthly Revenue
                  </p>
                  <p className="mt-3 text-3xl font-bold text-blue-900">{formatCurrency(metrics.monthly_revenue)}</p>
                  <p className="mt-1 text-xs text-blue-700/80">Current month performance</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Franchise Counts
                  </p>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{metrics.total_franchises}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Active: <span className="font-semibold">{metrics.active_franchises}</span> · Pending:{' '}
                    <span className="font-semibold">{metrics.pending_franchises}</span>
                  </p>
                </div>
              </section>
            ) : null}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Franchise Applications</h2>
                <p className="text-sm text-gray-500">Approve new partners to grow the network</p>
              </div>

              {franchises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-gray-300 rounded-2xl">
                  <p className="text-gray-500">No franchise applications found yet.</p>
                  <p className="text-sm text-gray-400">Share the registration link to invite new franchisees.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {franchises.map((franchise) => (
                    <FranchiseCard
                      key={franchise.id}
                      franchise={franchise}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onReview={handleReview}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                  <p className="text-sm text-gray-500">Last 10 sales recorded across all franchises</p>
                </div>
              </div>

              {recentSales.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-500">No sales recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Franchise
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Payment Mode
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(sale.sale_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sale.franchise_name || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {sale.owner_name || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(sale.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sale.payment_mode || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {modalFranchise ? (
        <ReviewModal
          franchise={modalFranchise}
          onClose={closeModal}
          onApprove={handleApprove}
          onReject={handleReject}
          formatDate={formatDate}
        />
      ) : null}
    </div>
  );
}
