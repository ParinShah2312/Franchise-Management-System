export default function Modal({ isOpen, onClose, title, description, children, maxWidth = 'max-w-md' }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className={`w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col`}>
                {(title || description || onClose) && (
                    <header className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
                        <div>
                            {title && <h3 className="text-xl font-semibold text-gray-900">{title}</h3>}
                            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 transition hover:text-gray-600 focus:outline-none"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        )}
                    </header>
                )}
                <div className="px-6 py-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
