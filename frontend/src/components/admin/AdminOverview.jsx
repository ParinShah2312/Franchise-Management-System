import { useState, useEffect } from 'react';
import StatCard from '../ui/StatCard';
import AlertBanner from '../ui/AlertBanner';
import { formatINR } from '../../utils';
import { API_ORIGIN } from '../../api';

export default function AdminOverview({
  metrics,
  primaryFranchise,
  updateFranchise,
  menuUploading,
  onMenuButtonClick,
  onMenuFileChange,
  fileInputRef,
  onNavigateToApplications,
}) {
  const [dismissed, setDismissed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [franchiseNameInput, setFranchiseNameInput] = useState('');

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
            <h2 className="text-lg font-semibold text-gray-900">Franchise Profile</h2>
            <p className="text-sm text-gray-500">
              Manage your brand name and customer-facing identity.
            </p>
          </div>
          {!isEditingName && primaryFranchise && (
            <button
              type="button"
              onClick={() => {
                setFranchiseNameInput(primaryFranchise.franchise_name || '');
                setIsEditingName(true);
              }}
              className="text-sm px-4 py-2 font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Edit Name
            </button>
          )}
        </div>

        <div className="mt-4">
          {isEditingName ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={franchiseNameInput}
                onChange={(e) => setFranchiseNameInput(e.target.value)}
                className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter franchise name"
                autoFocus
              />
              <button
                type="button"
                onClick={async () => {
                  if (franchiseNameInput.trim()) {
                    await updateFranchise?.(primaryFranchise?.franchise_id, franchiseNameInput);
                  }
                  setIsEditingName(false);
                }}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
             <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Brand Name</span>
              <span className="text-xl font-bold text-gray-800 mt-1">{primaryFranchise?.franchise_name || '—'}</span>
            </div>
          )}
        </div>
      </section>

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
