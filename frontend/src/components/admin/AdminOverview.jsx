import { useState, useEffect } from 'react';
import StatCard from '../ui/StatCard';
import AlertBanner from '../ui/AlertBanner';
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
        <AlertBanner
          title={`${metrics.pending_apps} application${metrics.pending_apps === 1 ? '' : 's'} pending review`}
          variant="warning"
          onDismiss={() => setDismissed(true)}
        >
          {onNavigateToApplications && (
            <button
              type="button"
              onClick={onNavigateToApplications}
              className="mt-1 text-sm font-semibold text-amber-900 border-none bg-transparent p-0 hover:underline"
            >
              Review now →
            </button>
          )}
        </AlertBanner>
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
