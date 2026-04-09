import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Styled confirmation dialog to replace native window.confirm().
 * Renders via portal at document.body with the app's modal z-index.
 */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }) {
    if (!open) return null;

    const confirmStyles = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
        primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    };

    return createPortal(
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 mx-2 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{message}</p>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmStyles[variant] || confirmStyles.danger}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

ConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    variant: PropTypes.oneOf(['danger', 'warning', 'primary']),
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};
