import { useAuth } from '../context/AuthContext';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { usePersistedTab } from '../hooks/usePersistedTab';
import Toast from '../components/Toast';
import Tabs from '../components/ui/Tabs';
import {
  ApplicationModal,
  RejectionModal,
  AdminOverview,
  AdminNetwork,
  AdminApplications,
  AdminCatalog,
  AdminRoyalty,
  AdminReports,
} from '../components/admin';
import { FaqAccordion } from '../components/shared';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';
import SkeletonTable from '../components/ui/SkeletonTable';
import ErrorState from '../components/ui/ErrorState';

const ADMIN_FAQ = [
  {
    question: "How do I approve a franchise application?",
    answer: "Go to the Applications tab. Click \"Review\" on any pending application to open the full detail modal. After reviewing the applicant's information and supporting document, click \"Approve\" to automatically create the branch and assign the branch owner role, or \"Reject\" to decline with a written reason.",
  },
  {
    question: "How is royalty calculated?",
    answer: "Go to the Royalty tab to configure your franchisor cut percentage. Every sale recorded at any branch automatically splits the revenue according to your configured percentage. View per-branch royalty breakdowns by month in the Royalty Summary section.",
  },
  {
    question: "How do I upload a menu for my branches?",
    answer: "On the Overview tab, find the Menu Management card and click \"Upload menu\". Select a PDF or image file (max 5MB). The menu will be accessible to all branches under your franchise via their dashboard.",
  },
  {
    question: "How do I deactivate a branch?",
    answer: "Go to the Network tab. Find the branch in the table and click \"Deactivate\". The branch status changes to INACTIVE immediately. You can reactivate it at any time using the Activate button in the same row.",
  },
  {
    question: "How do I generate a financial report?",
    answer: "Go to the Reports tab, select the month and year, and click \"Generate Report\". The report includes total sales, expenses, profit/loss, and per-branch royalty breakdown. Click \"Download PDF\" to export a professionally formatted report.",
  },
  {
    question: "Can I manage multiple franchise brands?",
    answer: "Each Relay account is tied to a single franchise brand. If you operate multiple brands, you'll need a separate Relay account for each. Contact support at hello@relayhq.com for enterprise multi-brand arrangements.",
  },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = usePersistedTab('relay_tab_admin', 'overview');
  const {
    metrics, applications, loading, error, toast,
    modalApplication, actionState,
    menuUploading,
    rejectionModal, rejectionNote, setRejectionNote,
    rejectionSubmitting, rejectionError,
    flattenedBranches, primaryFranchise,
    handleApprove, openRejectionModal, closeRejectionModal, submitRejection,
    openApplication, closeModal,
    handleMenuButtonClick, handleMenuFileChange,
    setToast, fileInputRef,
    products, productsLoading, refreshProducts, refreshCatalog,
    categories, categoriesLoading, createCategory, createProduct, updateProduct,
    stockItems, stockItemsLoading, stockItemsError,
    units, unitsLoading,
    createStockItem, fetchIngredients, addIngredient, removeIngredient,
    fetchStockItemProducts,
    fetchDashboard,
    toggleBranchStatus,
    updateFranchise,
    config, configLoading, configured, saveConfig, saving, saveError,
    summary, summaryLoading, summaryError, fetchSummary,
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport,
  } = useAdminDashboard();

  const pendingApplicationsCount = applications.length;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'network', label: 'Network' },
    {
      key: 'applications',
      label: 'Applications',
      badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : null,
    },
    { key: 'catalog', label: 'Catalog' },
    { key: 'royalty', label: 'Royalty' },
    { key: 'reports', label: 'Reports' },
  ];

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      if (error && !metrics) return <ErrorState message={error} onRetry={fetchDashboard} />;
      if (loading) return <DashboardSkeleton statCount={3} showTable={false} />;
      return (
        <>
          <AdminOverview metrics={metrics} primaryFranchise={primaryFranchise} updateFranchise={updateFranchise} menuUploading={menuUploading} onMenuButtonClick={handleMenuButtonClick} onMenuFileChange={handleMenuFileChange} fileInputRef={fileInputRef} onNavigateToApplications={() => setActiveTab('applications')} />
          <FaqAccordion items={ADMIN_FAQ} />
        </>
      );
    }
    if (activeTab === 'network') {
      if (loading) return <SkeletonTable rows={6} cols={6} />;
      return <AdminNetwork flattenedBranches={flattenedBranches} onToggleStatus={toggleBranchStatus} />;
    }
    if (activeTab === 'catalog') {
      if (stockItemsLoading || categoriesLoading || productsLoading) return <DashboardSkeleton statCount={2} showTable={true} />;
      return (
      <AdminCatalog
        stockItems={stockItems}
        stockItemsLoading={stockItemsLoading}
        stockItemsError={stockItemsError}
        units={units}
        unitsLoading={unitsLoading}
        products={products}
        productsLoading={productsLoading}
        createStockItem={createStockItem}
        fetchIngredients={fetchIngredients}
        addIngredient={addIngredient}
        removeIngredient={removeIngredient}
        fetchStockItemProducts={fetchStockItemProducts}
        categories={categories}
        categoriesLoading={categoriesLoading}
        createCategory={createCategory}
        createProduct={createProduct}
        updateProduct={updateProduct}
        refreshProducts={refreshProducts}
      />
    );
    }
    if (activeTab === 'royalty') {
      if (loading) return <DashboardSkeleton statCount={2} showTable={true} />;
      return (
        <AdminRoyalty
          config={config}
          configLoading={configLoading}
          configured={configured}
          saveConfig={saveConfig}
          saving={saving}
          saveError={saveError}
          summary={summary}
          summaryLoading={summaryLoading}
          summaryError={summaryError}
          fetchSummary={fetchSummary}
        />
      );
    }
    if (activeTab === 'reports') {
      if (loading) return <DashboardSkeleton statCount={2} showTable={true} />;
      return (
      <AdminReports
        report={report}
        reportLoading={reportLoading}
        reportError={reportError}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onGenerate={generateReport}
        generatedBy={user?.name || null}
        branches={flattenedBranches}
      />
    );
    }
    if (loading) return <SkeletonTable rows={4} cols={5} />;
    return <AdminApplications applications={applications} onOpenApplication={openApplication} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Franchisor Dashboard</h1>
            <p className="hidden sm:block text-gray-500 text-sm">
              Welcome back{user?.name ? `, ${user.name}` : ''}! Monitor network health and manage expansion requests.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'catalog') refreshCatalog();
                else fetchDashboard();
              }}
              className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              Refresh Data
            </button>
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
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {error && metrics && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="space-y-8 animate-fade-in">{renderTabContent()}</div>
      </main>

      <ApplicationModal application={modalApplication} onClose={closeModal} onApprove={handleApprove} onReject={openRejectionModal} actionState={actionState} />
      <RejectionModal isOpen={rejectionModal.open} onClose={closeRejectionModal} onSubmit={submitRejection} rejectionNote={rejectionNote} setRejectionNote={setRejectionNote} isSubmitting={rejectionSubmitting} error={rejectionError} />
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}

