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
} from '../components/admin';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'network', label: 'Network' },
  { key: 'applications', label: 'Applications' },
  { key: 'catalog', label: 'Catalog' },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
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
    products, productsLoading,
    stockItems, stockItemsLoading, stockItemsError,
    units, unitsLoading,
    createStockItem, fetchIngredients, addIngredient, removeIngredient
  } = useAdminDashboard();

  const renderTabContent = () => {
    if (loading) return <div className="flex justify-center py-20"><p className="text-gray-500">Loading dashboard…</p></div>;
    if (activeTab === 'overview') return <AdminOverview metrics={metrics} primaryFranchise={primaryFranchise} menuUploading={menuUploading} onMenuButtonClick={handleMenuButtonClick} onMenuFileChange={handleMenuFileChange} fileInputRef={fileInputRef} />;
    if (activeTab === 'network') return <AdminNetwork flattenedBranches={flattenedBranches} />;
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
      />
    );
    return <AdminApplications applications={applications} onOpenApplication={openApplication} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Franchisor Dashboard</h1>
            <p className="text-sm text-gray-500">Monitor network health and manage expansion requests</p>
          </div>
          <button type="button" onClick={logout} className="btn-outline px-4 py-2 text-sm">Logout</button>
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

