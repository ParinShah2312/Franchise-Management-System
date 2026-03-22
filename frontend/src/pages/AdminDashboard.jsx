import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api, API_ORIGIN } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Table from '../components/ui/Table';
import Tabs from '../components/ui/Tabs';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'network', label: 'Network' },
  { key: 'applications', label: 'Applications' },
];


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
    <Modal
      isOpen={!!application}
      onClose={onClose}
      title="Application review"
      description="Verify the applicant's details before approving or rejecting."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8">
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
    </Modal>
  );
}

function RejectionModal({ isOpen, onClose, onSubmit, rejectionNote, setRejectionNote, isSubmitting, error }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Reject Application</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <p className="text-sm text-gray-600">
          Please provide a reason for rejection. This will be recorded against the application.
        </p>
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <textarea
            className="input-field w-full"
            rows={5}
            maxLength={500}
            placeholder="e.g. Investment capacity does not meet the minimum threshold for this franchise."
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {rejectionNote.length} / 500 characters
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow hover:bg-red-700 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
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
  const [toast, setToast] = useState(null);

  const [metrics, setMetrics] = useState(null);
  const [network, setNetwork] = useState([]);
  const [applications, setApplications] = useState([]);
  const [menuUploading, setMenuUploading] = useState(false);

  const [modalApplication, setModalApplication] = useState(null);
  const [actionState, setActionState] = useState({ id: null, type: null });
  const fileInputRef = useRef(null);

  const [rejectionModal, setRejectionModal] = useState({ open: false, applicationId: null });
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);
  const [rejectionError, setRejectionError] = useState('');

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
      const message = err.message || 'Unable to load dashboard data.';
      setError(message);
      setToast({ message, variant: 'error' });
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

  const openRejectionModal = (applicationId) => {
    setRejectionModal({ open: true, applicationId });
    setRejectionNote('');
    setRejectionError('');
  };

  const closeRejectionModal = () => {
    setRejectionModal({ open: false, applicationId: null });
    setRejectionNote('');
    setRejectionError('');
  };

  const submitRejection = async () => {
    const trimmed = rejectionNote.trim();
    if (trimmed.length < 10) {
      setRejectionError('Rejection reason must be at least 10 characters.');
      return;
    }
    
    setRejectionError('');
    setRejectionSubmitting(true);
    try {
      await api.put(
        `/franchises/applications/${rejectionModal.applicationId}/reject`,
        { notes: trimmed }
      );
      await fetchDashboard();
      setRejectionModal({ open: false, applicationId: null });
      setRejectionNote('');
      setModalApplication(null); // close the ApplicationModal too if still open
      setToast({ message: 'Application rejected successfully.', variant: 'success' });
    } catch (err) {
      setRejectionError(err.message || 'Failed to reject application.');
    } finally {
      setRejectionSubmitting(false);
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

  const primaryFranchise = useMemo(() => {
    if (!Array.isArray(network) || network.length === 0) return null;
    return network[0];
  }, [network]);

  const handleMenuButtonClick = () => {
    if (!primaryFranchise) {
      setToast({ message: 'No franchise found to upload a menu for.', variant: 'error' });
      return;
    }
    fileInputRef.current?.click();
  };

  const uploadMenuFile = async (file) => {
    if (!file || !primaryFranchise) return;

    const formData = new FormData();
    formData.append('menu_file', file);

    setMenuUploading(true);

    try {
      await api.post(`/franchises/${primaryFranchise.franchise_id}/menu`, formData);
      setToast({ message: 'Menu uploaded successfully!', variant: 'success' });
      await fetchDashboard();
    } catch (err) {
      setToast({ message: err.message || 'Failed to upload menu.', variant: 'error' });
    } finally {
      setMenuUploading(false);
    }
  };

  const handleMenuFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMenuFile(file);
    }
    event.target.value = '';
  };

  const openApplication = (application) => {
    setModalApplication(application);
  };

  const closeModal = () => setModalApplication(null);

  const overviewContent = (
    <div className="space-y-6">
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

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Menu management</h2>
            <p className="text-sm text-gray-500">
              Upload a PDF or image of the latest franchise menu for all branches to access.
            </p>
          </div>
          <button
            type="button"
            onClick={handleMenuButtonClick}
            disabled={menuUploading || !primaryFranchise}
            className={`btn-primary ${menuUploading || !primaryFranchise ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {menuUploading ? 'Uploading…' : 'Upload menu'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="font-medium text-gray-700">Current menu:</span>
          {primaryFranchise?.menu_file_url ? (
            <a
              href={`${API_ORIGIN}${primaryFranchise.menu_file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              📄 View menu
            </a>
          ) : (
            <span className="text-gray-500">No menu uploaded yet.</span>
          )}
        </div>
      </section>
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
        <div className="mt-6">
          <Table
            headers={['Branch', 'Franchise', 'Location', 'Owner', 'Manager', 'Status']}
            data={flattenedBranches}
            renderRow={(row) => (
              <tr key={row.branchId} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.branchName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.franchiseName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.location || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.ownerName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.managerName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.status || '—'}</td>
              </tr>
            )}
          />
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
        <div className="mt-6">
          <Table
            headers={['Applicant', 'Location', 'Investment', 'Submitted', 'Actions']}
            data={applications}
            renderRow={(application) => (
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
            )}
          />
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

        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="space-y-8">{renderTabContent()}</div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleMenuFileChange}
      />

      <ApplicationModal
        application={modalApplication}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={openRejectionModal}
        actionState={actionState}
      />

      <RejectionModal
        isOpen={rejectionModal.open}
        onClose={closeRejectionModal}
        onSubmit={submitRejection}
        rejectionNote={rejectionNote}
        setRejectionNote={setRejectionNote}
        isSubmitting={rejectionSubmitting}
        error={rejectionError}
      />

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
