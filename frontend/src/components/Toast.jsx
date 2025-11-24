import { useEffect } from 'react';
import PropTypes from 'prop-types';

const VARIANT_STYLES = {
  success: 'bg-green-50 border-green-200 text-green-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
};

export default function Toast({ message, variant = 'info', onDismiss, autoHideDuration = 4000 }) {
  useEffect(() => {
    if (!message) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (typeof onDismiss === 'function') {
        onDismiss();
      }
    }, autoHideDuration);

    return () => window.clearTimeout(timeoutId);
  }, [autoHideDuration, message, onDismiss]);

  if (!message) {
    return null;
  }

  const variantClass = VARIANT_STYLES[variant] ?? VARIANT_STYLES.info;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all ${variantClass}`}
    >
      <div className="flex-1 text-sm">
        <p className="font-medium leading-5">{message}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string,
  variant: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
  onDismiss: PropTypes.func,
  autoHideDuration: PropTypes.number,
};
