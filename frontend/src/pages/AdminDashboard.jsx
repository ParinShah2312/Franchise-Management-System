import { useAuth } from '../context/AuthContext';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
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

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'network', label: 'Network' },
  { key: 'applications', label: 'Applications' },
  { key: 'catalog', label: 'Catalog' },
  { key: 'royalty', label: 'Royalty' },
  { key: 'reports', label: 'Reports' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const {
    metrics, applications, loading, error, toast,
    activeTab, setActiveTab,
    modalApplication, actionState,
    menuUploading,
    rejectionModal, rejectionNote, setRejectionNote,
    rejectionSubmitting, rejectionError,
    flattenedBranches, primaryFranchise,
    handleApprove, openRejectionModal, closeRejectionModal, submitRejection,
    openApplication, closeModal,
    handleMenuButtonClick, handleMenuFileChange,
    setToast, fileInputRef,
    products, productsLoading, refreshProducts,
    categories, categoriesLoading, createCategory, createProduct, updateProduct,
    stockItems, stockItemsLoading, stockItemsError,
    units, unitsLoading,
    createStockItem, fetchIngredients, addIngredient, removeIngredient,
    fetchDashboard,
    toggleBranchStatus,
    config, configLoading, configured, saveConfig, saving, saveError,
    summary, summaryLoading, summaryError, fetchSummary,
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport, downloadCSV,
  } = useAdminDashboard();

  const renderTabContent = () => {
    if (loading) return <div className="flex justify-center py-20"><p className="text-gray-500">Loading dashboard…</p></div>;
    if (activeTab === 'overview') return <AdminOverview metrics={metrics} primaryFranchise={primaryFranchise} menuUploading={menuUploading} onMenuButtonClick={handleMenuButtonClick} onMenuFileChange={handleMenuFileChange} fileInputRef={fileInputRef} />;
    if (activeTab === 'network') return <AdminNetwork flattenedBranches={flattenedBranches} onToggleStatus={toggleBranchStatus} />;
    if (activeTab === 'catalog') return (
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
        categories={categories}
        categoriesLoading={categoriesLoading}
        createCategory={createCategory}
        createProduct={createProduct}
        updateProduct={updateProduct}
        refreshProducts={refreshProducts}
      />
    );
    if (activeTab === 'royalty') return (
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
    if (activeTab === 'reports') return (
      <AdminReports
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
    return <AdminApplications applications={applications} onOpenApplication={openApplication} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Franchisor Dashboard</h1>
            <p className="text-gray-500 text-sm">
              Welcome back{user?.name ? `, ${user.name}` : ''}! Monitor network health and manage expansion requests.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={fetchDashboard}
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
      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="space-y-8">{renderTabContent()}</div>
      </main>

      <ApplicationModal application={modalApplication} onClose={closeModal} onApprove={handleApprove} onReject={openRejectionModal} actionState={actionState} />
      <RejectionModal isOpen={rejectionModal.open} onClose={closeRejectionModal} onSubmit={submitRejection} rejectionNote={rejectionNote} setRejectionNote={setRejectionNote} isSubmitting={rejectionSubmitting} error={rejectionError} />
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}

