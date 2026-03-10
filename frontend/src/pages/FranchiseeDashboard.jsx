import { useCallback, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useSales } from '../hooks/useSales';
import { useRequests } from '../hooks/useRequests';
import { useFranchiseMetrics } from '../hooks/useFranchiseMetrics';
import { useFranchiseStaff } from '../hooks/useFranchiseStaff';

import Toast from '../components/Toast';
import FranchiseeOverview from '../components/franchisee/FranchiseeOverview';
import FranchiseeRequests from '../components/franchisee/FranchiseeRequests';
import FranchiseeStaff from '../components/franchisee/FranchiseeStaff';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Stock Requests' },
  { id: 'staff', label: 'My Staff' },
];

export default function FranchiseeDashboard() {
  const { user, getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const { metrics, loading: metricsLoading, error: metricsError, refreshMetrics } = useFranchiseMetrics(branchId);
  const { sales, loading: salesLoading, error: salesError, refreshSales } = useSales(branchId);
  const { requests, loading: reqLoading, error: reqError, updateRequestStatus, refreshRequests } = useRequests(branchId);
  const { staff, loading: staffLoading, error: staffError, appointManager, refreshStaff } = useFranchiseStaff(branchId);

  const loading = !branchId ? false : (metricsLoading || salesLoading || reqLoading || staffLoading);
  const error = !branchId ? 'No branch is currently assigned to your account. Please contact support.' : (metricsError || salesError || reqError || staffError || '');

  const loadData = useCallback(() => {
    refreshMetrics();
    refreshSales();
    refreshRequests();
    refreshStaff();
  }, [refreshMetrics, refreshSales, refreshRequests, refreshStaff]);

  const pendingRequestsCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING').length,
    [requests]
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return <FranchiseeRequests requests={requests} updateRequestStatus={updateRequestStatus} onRefresh={loadData} setToast={setToast} />;
      case 'staff':
        return <FranchiseeStaff staff={staff} appointManager={appointManager} setToast={setToast} />;
      case 'overview':
      default:
        return <FranchiseeOverview metrics={metrics} sales={sales} onRefresh={loadData} />;
    }
  };

  const renderHeader = (showRefreshButton = true) => (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Franchisee Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.email || 'branch owner'}</p>
        </div>
        <div className="flex items-center space-x-3">
          {showRefreshButton ? (
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              Refresh Data
            </button>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader(true)}

      <main className="max-w-6xl mx-auto px-6 py-10">
        {error ? (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-gray-500">Loading your franchise data…</p>
          </div>
        ) : !metrics || Object.keys(metrics).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Franchise information unavailable</h3>
            <p className="text-sm">
              We couldn’t find a franchise linked to your account. Please contact support for assistance.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <nav className="flex space-x-3">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${activeTab === tab.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
                    }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {tab.label}
                    {tab.id === 'requests' && pendingRequestsCount > 0 ? (
                      <span className="inline-flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full px-2">
                        {pendingRequestsCount}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </nav>

            {renderContent()}
          </div>
        )}
      </main>

      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
    </div>
  );
}