import { useState } from 'react';
import { API_ORIGIN } from '../../api';
import Modal from '../ui/Modal';
import { formatDate, formatINR, STORAGE_KEYS } from '../../utils';

export default function ApplicationModal({ application, onClose, onApprove, onReject, actionState }) {
  const [docLoading, setDocLoading] = useState(false);

  if (!application) return null;

  const documentHref = application.document_url
    ? `${API_ORIGIN}${application.document_url}`
    : null;

  const handleViewDocument = async () => {
    if (!documentHref || docLoading) return;
    setDocLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const res = await fetch(documentHref, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch document');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Revoke after a delay so the new tab has time to load
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      alert('Could not open the document. Please try again.');
    } finally {
      setDocLoading(false);
    }
  };

  const isProcessingApprove =
    actionState?.id === application.application_id && actionState?.type === 'approve';
  const isProcessingReject =
    actionState?.id === application.application_id && actionState?.type === 'reject';

  const toSentenceCase = (value) => {
    if (!value) return '—';
    const lower = value.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
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
            <p className="text-gray-500">Submitted {formatDate(application.submitted_at) || '—'}</p>
          </div>
          <div>
            <p className="label mb-1">Proposed location</p>
            <p className="font-semibold text-gray-900">{application.proposed_location || '—'}</p>
          </div>
          <div>
            <p className="label mb-1">Investment capacity</p>
            <p className="font-semibold text-gray-900">
              {formatINR(application.investment_capacity)}
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
              <button
                type="button"
                onClick={handleViewDocument}
                disabled={docLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
              >
                {docLoading ? '⏳ Opening…' : '📄 View document'}
              </button>
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
