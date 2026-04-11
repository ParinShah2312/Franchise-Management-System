import { createPortal } from 'react-dom';
import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function Modal({ isOpen, onClose, title, description, children, maxWidth = 'max-w-md' }) {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !onClose) return;
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4" onClick={onClose}>
            <div className={`w-full ${maxWidth} overflow-hidden rounded-xl bg-white shadow-2xl max-h-[90dvh] flex flex-col mx-2`} onClick={(e) => e.stopPropagation()}>
                {(title || description || onClose) && (
                    <header className="flex items-center justify-between border-b border-gray-100 px-4 sm:px-6 py-5 shrink-0">
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
                <div ref={scrollRef} className="px-4 sm:px-6 py-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
    title: PropTypes.string,
    description: PropTypes.string,
    children: PropTypes.node,
    maxWidth: PropTypes.string,
};
