import { useEffect } from 'react';
import Modal from '../ui/Modal';

export default function RejectionModal({ isOpen, onClose, onSubmit, rejectionNote, setRejectionNote, isSubmitting, error }) {
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    // Use capture phase so this fires before the underlying Modal's listener
    document.addEventListener('keydown', handleEsc, true);
    return () => document.removeEventListener('keydown', handleEsc, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Application"
    >
        <p className="text-sm text-gray-600 mb-6">
          Please provide a reason for rejection. This will be recorded against the application.
        </p>
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="mb-6">
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
    </Modal>
  );
}
