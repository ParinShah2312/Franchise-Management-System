import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useFranchiseeDashboard } from '../hooks/useFranchiseeDashboard';

import Toast from '../components/Toast';
import Tabs from '../components/ui/Tabs';
import FranchiseeOverview from '../components/franchisee/FranchiseeOverview';
import FranchiseeRequests from '../components/franchisee/FranchiseeRequests';
import FranchiseeStaff from '../components/franchisee/FranchiseeStaff';
import FranchiseeReports from '../components/franchisee/FranchiseeReports';
import FranchiseeExpenses from '../components/franchisee/FranchiseeExpenses';

export default function FranchiseeDashboard() {
  const { user, getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const {
    metrics, sales, requests, staff,
    updateRequestStatus, appointManager,
    expenses, deleteExpense, refreshExpenses,
    loading, error, pendingRequestsCount, loadData,
    deactivateUser, activateUser, forceResetUser,
    branchSummary, branchSummaryLoading,
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport, downloadCSV,
  } = useFranchiseeDashboard(branchId);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: 'Stock Requests', badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
    { key: 'staff', label: 'My Staff' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'reports', label: 'Reports' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return <FranchiseeRequests requests={requests} updateRequestStatus={updateRequestStatus} onRefresh={loadData} setToast={setToast} />;
      case 'staff':
        return <FranchiseeStaff staff={staff} appointManager={appointManager} setToast={setToast} onDeactivate={deactivateUser} onActivate={activateUser} onForceReset={forceResetUser} />;
      case 'expenses':
        return <FranchiseeExpenses expenses={expenses} deleteExpense={deleteExpense} onRefresh={refreshExpenses} setToast={setToast} />;
      case 'reports':
        return (
          <FranchiseeReports
            report={report}
            reportLoading={reportLoading}
            reportError={reportError}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onGenerate={generateReport}
            onDownloadCSV={downloadCSV}
          />
        );
      case 'overview':
      default:
        return <FranchiseeOverview metrics={metrics} sales={sales} onRefresh={loadData} branchSummary={branchSummary} branchSummaryLoading={branchSummaryLoading} />;
    }
  };

  const renderHeader = (showRefreshButton = true) => (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Franchisee Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.name || user?.email || 'branch owner'}</p>
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
            <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
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