import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, API_ORIGIN } from '../api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'network', label: 'Network' },
  { key: 'applications', label: 'Applications' },
];

function StatCard({ title, helper, value, accent }) {
  const accentClasses = {
    primary: 'bg-blue-50 border border-blue-100 text-blue-900',
    success: 'bg-green-50 border border-green-100 text-green-900',
    neutral: 'bg-gray-50 border border-gray-200 text-gray-900',
  };

  return (
    <div className={`card ${accentClasses[accent] ?? accentClasses.neutral}`}>
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      {helper ? <p className="mt-1 text-xs text-gray-600/80">{helper}</p> : null}
    </div>
  );
}

function ApplicationModal({ application, onClose, onApprove, onReject, actionState }) {
  if (!application) return null;

  const documentHref = application.document_url
    ? `${API_ORIGIN}${application.document_url}`
    : null;

  const isProcessingApprove =
    actionState?.id === application.application_id && actionState?.type === 'approve';
  const isProcessingReject =
    actionState?.id === application.application_id && actionState?.type === 'reject';

  const toSentenceCase = (value) => {
    if (!value) return '—';
    const lower = value.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '—';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(parsed);
  };

  const formatCurrency = (value) => {
    const numericValue = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Application review</h3>
            <p className="text-sm text-gray-500">
              Verify the applicant&apos;s details before approving or rejecting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        </header>

        <div className="space-y-8 px-6 py-6">
          <section className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <p className="label mb-1">Applicant</p>
              <p className="font-semibold text-gray-900">{application.applicant_name || '—'}</p>
              <p className="text-gray-500">{application.applicant_email || '—'}</p>
              <p className="text-gray-500">{application.applicant_phone || '—'}</p>
            </div>
            <div>
              <p className="label mb-1">Franchise brand</p>
              <p className="font-semibold text-gray-900">{application.franchise_name || '—'}</p>
              <p className="text-gray-500">Submitted {formatDate(application.submitted_at)}</p>
            </div>
            <div>
              <p className="label mb-1">Proposed location</p>
              <p className="font-semibold text-gray-900">{application.proposed_location || '—'}</p>
            </div>
            <div>
              <p className="label mb-1">Investment capacity</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(application.investment_capacity)}
              </p>
            </div>
          </section>

          <section className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="label mb-1">Business experience</p>
              <p className="whitespace-pre-line rounded-lg border border-border bg-gray-50 p-4">
                {application.business_experience || 'Not provided.'}
              </p>
            </div>
            <div>
              <p className="label mb-1">Reason for franchise</p>
              <p className="whitespace-pre-line rounded-lg border border-border bg-gray-50 p-4">
                {application.reason || 'Not provided.'}
              </p>
            </div>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="label mb-2">Supporting document</p>
              {documentHref ? (
                <a
                  href={documentHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  📄 View document
                </a>
              ) : (
                <p className="text-sm text-gray-500">No document uploaded.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="self-center text-sm text-gray-500">
                Status: {toSentenceCase(application.status)}
              </span>
              <button
                type="button"
                onClick={() => onReject(application.application_id)}
                className="btn-outline border-red-200 text-red-600 hover:border-red-400 hover:text-red-700"
                disabled={isProcessingApprove || isProcessingReject}
              >
                {isProcessingReject ? 'Rejecting…' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={() => onApprove(application.application_id)}
                className="btn-primary"
                disabled={isProcessingApprove || isProcessingReject}
              >
                {isProcessingApprove ? 'Approving…' : 'Approve'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [metrics, setMetrics] = useState(null);
  const [network, setNetwork] = useState([]);
  const [applications, setApplications] = useState([]);

  const [modalApplication, setModalApplication] = useState(null);
  const [actionState, setActionState] = useState({ id: null, type: null });

  const formatCurrency = (value) => {
    const numericValue = Number(value) || 0;
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

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsResponse, networkResponse, applicationsResponse] = await Promise.all([
        api.get('/dashboard/franchisor/metrics'),
        api.get('/franchises/network'),
        api.get('/franchises/applications'),
      ]);

      setMetrics(metricsResponse);
      setNetwork(Array.isArray(networkResponse) ? networkResponse : []);
      setApplications(Array.isArray(applicationsResponse) ? applicationsResponse : []);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const beginAction = (id, type) => setActionState({ id, type });
  const endAction = () => setActionState({ id: null, type: null });

  const handleApprove = async (applicationId) => {
    beginAction(applicationId, 'approve');
    try {
      await api.put(`/franchises/applications/${applicationId}/approve`);
      await fetchDashboard();
      setModalApplication((prev) =>
        prev && prev.application_id === applicationId ? null : prev
      );
    } catch (err) {
      setError(err.message || 'Failed to approve application.');
    } finally {
      endAction();
    }
  };

  const handleReject = async (applicationId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason === null) {
      return;
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      window.alert('Rejection reason is required.');
      return;
    }

    beginAction(applicationId, 'reject');
    try {
      await api.put(`/franchises/applications/${applicationId}/reject`, {
        notes: trimmed,
      });
      await fetchDashboard();
      setModalApplication((prev) =>
        prev && prev.application_id === applicationId ? null : prev
      );
    } catch (err) {
      setError(err.message || 'Failed to reject application.');
    } finally {
      endAction();
    }
  };

  const flattenedBranches = useMemo(() => {
    return network.flatMap((franchise) =>
      (franchise.branches || []).map((branch) => ({
        franchiseId: franchise.franchise_id,
        franchiseName: franchise.franchise_name,
        branchId: branch.branch_id,
        branchName: branch.name,
        location: branch.location,
        ownerName: branch.owner_name,
        managerName: branch.manager_name,
        status: branch.status,
      }))
    );
  }, [network]);

  const openApplication = (application) => {
    setModalApplication(application);
  };

  const closeModal = () => setModalApplication(null);

  const overviewContent = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        title="Total revenue"
        helper="Lifetime branch sales"
        value={formatCurrency(metrics?.revenue ?? 0)}
        accent="success"
      />
      <StatCard
        title="Active branches"
        helper="Currently open locations"
        value={metrics?.branches ?? 0}
        accent="primary"
      />
      <StatCard
        title="Pending applications"
        helper="Awaiting approval"
        value={metrics?.pending_apps ?? 0}
        accent="neutral"
      />
    </div>
  );

  const networkContent = (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Network overview</h2>
          <p className="text-sm text-gray-500">Active branches across all franchises</p>
        </div>
        <span className="text-sm text-gray-500">
          {flattenedBranches.length} branch{flattenedBranches.length === 1 ? '' : 'es'}
        </span>
      </div>

      {flattenedBranches.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-white py-12 text-center text-gray-500">
          No branches found yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                {['Branch', 'Franchise', 'Location', 'Owner', 'Manager', 'Status'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {flattenedBranches.map((row) => (
                <tr key={row.branchId} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.branchName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.franchiseName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.location || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.ownerName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.managerName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const applicationsContent = (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pending applications</h2>
          <p className="text-sm text-gray-500">Review incoming franchise partner requests</p>
        </div>
        <span className="text-sm text-gray-500">
          {applications.length} application{applications.length === 1 ? '' : 's'}
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center text-gray-500">
          No pending applications at the moment.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                {['Applicant', 'Location', 'Investment', 'Submitted', 'Actions'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {applications.map((application) => (
                <tr key={application.application_id}>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">
                    <div>{application.applicant_name || '—'}</div>
                    <div className="text-xs text-gray-500">{application.applicant_email || '—'}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{application.proposed_location || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {formatCurrency(application.investment_capacity)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {formatDate(application.submitted_at)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    <button
                      type="button"
                      onClick={() => openApplication(application)}
                      className="btn-outline px-4 py-2 text-sm"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <p className="text-gray-500">Loading dashboard…</p>
        </div>
      );
    }

    if (activeTab === 'overview') {
      return overviewContent;
    }

    if (activeTab === 'network') {
      return networkContent;
    }

    return applicationsContent;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Franchisor Dashboard</h1>
            <p className="text-sm text-gray-500">
              Monitor network health and manage expansion requests
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-outline px-4 py-2 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <nav className="mb-8 flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="space-y-8">{renderTabContent()}</div>
      </main>

      <ApplicationModal
        application={modalApplication}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
        actionState={actionState}
      />
    </div>
  );
}
