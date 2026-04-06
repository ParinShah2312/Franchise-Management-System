import { createPortal } from 'react-dom';

export default function RejectionModal({ isOpen, onClose, onSubmit, rejectionNote, setRejectionNote, isSubmitting, error }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
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
    </div>,
    document.body
  );
}
