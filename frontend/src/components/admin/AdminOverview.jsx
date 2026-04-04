import { useState, useEffect } from 'react';
import StatCard from '../ui/StatCard';
import { formatINR } from '../../utils';
import { API_ORIGIN } from '../../api';

export default function AdminOverview({
  metrics,
  primaryFranchise,
  menuUploading,
  onMenuButtonClick,
  onMenuFileChange,
  fileInputRef,
  onNavigateToApplications,
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (metrics?.pending_apps > 0) {
      setDismissed(false);
    }
  }, [metrics?.pending_apps]);

  return (
    <div className="space-y-6">
      {metrics?.pending_apps > 0 && !dismissed && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <svg className="h-5 w-5 text-amber-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-amber-800">
              {metrics.pending_apps} application{metrics.pending_apps === 1 ? '' : 's'} pending review
            </h4>
            {onNavigateToApplications && (
              <button
                type="button"
                onClick={onNavigateToApplications}
                className="mt-1 text-sm font-semibold text-amber-900 border-none bg-transparent p-0 hover:underline"
              >
                Review now →
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-600 transition-colors p-0.5"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total revenue"
          helper="Lifetime branch sales"
          value={formatINR(metrics?.revenue ?? 0)}
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
            onClick={onMenuButtonClick}
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={onMenuFileChange}
      />
    </div>
  );
}
