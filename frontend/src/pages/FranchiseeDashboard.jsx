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
import { FaqAccordion } from '../components/shared';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';
import SkeletonTable from '../components/ui/SkeletonTable';
import ErrorState from '../components/ui/ErrorState';

const FRANCHISEE_FAQ = [
  {
    question: "How do I approve a stock request from my manager?",
    answer: "Go to the Stock Requests tab. You'll see all pending requests submitted by your manager. Click \"Approve\" to release the stock into branch inventory automatically, or \"Reject\" to decline. Approved requests update inventory records immediately.",
  },
  {
    question: "How do I appoint a branch manager?",
    answer: "Go to the My Staff tab. If no manager is assigned, an \"Appoint Manager\" button will appear. Fill in the manager's name, email, phone, and a temporary password. They will be prompted to set a new password on their very first login.",
  },
  {
    question: "How do I view my royalty earnings?",
    answer: "Your royalty share is shown on the Overview tab under \"Royalty Earned (MTD)\". For a detailed monthly breakdown, go to the Reports tab, select a month and year, and generate a report.",
  },
  {
    question: "How do I deactivate a staff member?",
    answer: "Go to the My Staff tab. Find the staff member in the Support Staff table and click \"Deactivate\". They lose access immediately. Use the \"Reactivate\" button to restore their access at any time.",
  },
  {
    question: "What does Inventory Value represent?",
    answer: "Inventory Value is calculated from approved stock-in transactions and their recorded unit costs. It represents the cumulative value of all stock received into your branch since it was set up.",
  },
  {
    question: "How do I log an expense?",
    answer: "Go to the Expenses tab and click \"Log Expense\". Select the category, enter the date, amount, and an optional description. All expenses are included in your monthly profit/loss report under the Reports tab.",
  },
];

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
    generateReport,
  } = useFranchiseeDashboard(branchId);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: 'Stock Requests', badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
    { key: 'staff', label: 'My Staff' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'reports', label: 'Reports' },
  ];

  const renderContent = () => {
    if (error && !metrics) return <ErrorState message={error} onRetry={loadData} />;
    
    switch (activeTab) {
      case 'requests':
        if (loading) return <SkeletonTable rows={4} cols={4} />;
        return <FranchiseeRequests requests={requests} updateRequestStatus={updateRequestStatus} onRefresh={loadData} setToast={setToast} />;
      case 'staff':
        if (loading) return <DashboardSkeleton statCount={1} showTable={true} />;
        return <FranchiseeStaff staff={staff} appointManager={appointManager} setToast={setToast} onDeactivate={deactivateUser} onActivate={activateUser} onForceReset={forceResetUser} />;
      case 'expenses':
        if (loading) return <SkeletonTable rows={5} cols={5} />;
        return <FranchiseeExpenses expenses={expenses} deleteExpense={deleteExpense} onRefresh={refreshExpenses} setToast={setToast} />;
      case 'reports':
        if (loading) return <DashboardSkeleton statCount={3} showTable={false} />;
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
            generatedBy={user?.name || null}
          />
        );
      case 'overview':
      default:
        if (loading) return <DashboardSkeleton statCount={5} showTable={true} />;
        return (
          <>
            <FranchiseeOverview metrics={metrics} sales={sales} onRefresh={loadData} branchSummary={branchSummary} branchSummaryLoading={branchSummaryLoading} />
            <FaqAccordion items={FRANCHISEE_FAQ} />
          </>
        );
    }
  };

  const renderHeader = (showRefreshButton = true) => (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Franchisee Dashboard</h1>
          <p className="hidden sm:block text-gray-500 text-sm">Welcome back, {user?.name || user?.email || 'branch owner'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {error && metrics ? (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : null}

        <div className="space-y-8 animate-fade-in">
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          {renderContent()}
        </div>
      </main>

      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
    </div>
  );
}