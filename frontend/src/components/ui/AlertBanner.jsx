import PropTypes from 'prop-types';

/**
 * Reusable dismissible alert banner.
 * Supports 'warning' (amber) and 'info' (blue) variants.
 */
export default function AlertBanner({ title, children, variant = 'warning', onDismiss }) {
    const styles = {
        warning: {
            wrapper: 'border-amber-200 bg-amber-50',
            icon: 'text-amber-500',
            title: 'text-amber-800',
            dismiss: 'text-amber-400 hover:text-amber-600',
        },
        info: {
            wrapper: 'border-blue-200 bg-blue-50',
            icon: 'text-blue-500',
            title: 'text-blue-800',
            dismiss: 'text-blue-400 hover:text-blue-600',
        },
    };

    const s = styles[variant] || styles.warning;

    return (
        <div className={`flex items-start gap-3 rounded-xl border ${s.wrapper} px-4 py-3 shadow-sm`}>
            <svg className={`h-5 w-5 ${s.icon} shrink-0`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold ${s.title}`}>{title}</h4>
                {children}
            </div>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className={`${s.dismiss} transition-colors p-0.5`}
                    aria-label="Dismiss banner"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

AlertBanner.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    variant: PropTypes.oneOf(['warning', 'info']),
    onDismiss: PropTypes.func,
};
