export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-1">Something went wrong</p>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">{message || 'Unable to load data. Please try again.'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
