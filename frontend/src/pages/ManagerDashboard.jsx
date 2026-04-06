import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useManagerDashboard } from '../hooks/useManagerDashboard';

import Toast from '../components/Toast';
import Tabs from '../components/ui/Tabs';
import LowStockBanner from '../components/ui/LowStockBanner';
import ManagerOverview from '../components/manager/ManagerOverview';
import ManagerStaff from '../components/manager/ManagerStaff';
import ManagerInventory from '../components/manager/ManagerInventory';
import ManagerSales from '../components/manager/ManagerSales';
import ManagerRequests from '../components/manager/ManagerRequests';
import ManagerExpenses from '../components/manager/ManagerExpenses';

export default function ManagerDashboard() {
  const { user, getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = useState('overview');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    staff, addStaff, refreshStaff, forceResetUser,
    inventoryItems, stockItems, addInventory, recordDelivery, refreshInventory,
    sales, products, logSale, refreshSales,
    requests, createRequest, refreshRequests,
    expenses, logExpense, deleteExpense, refreshExpenses,
    loading, error, pendingRequestsCount, lowStockItems, lowStockItemsCount, todaySalesTotal, loadData,
  } = useManagerDashboard(branchId);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'staff', label: 'My Staff' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'sales', label: 'Sales' },
    { key: 'requests', label: 'Stock Requests', badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
    { key: 'expenses', label: 'Expenses' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'staff':
        return <ManagerStaff staff={staff} addStaff={addStaff} setToast={setToast} onForceReset={forceResetUser} />;
      case 'inventory':
        return <ManagerInventory inventoryItems={inventoryItems} stockItems={stockItems} addInventory={addInventory} recordDelivery={recordDelivery} refreshInventory={refreshInventory} setToast={setToast} />;
      case 'sales':
        return <ManagerSales sales={sales} products={products} logSale={logSale} refreshSales={refreshSales} setToast={setToast} />;
      case 'requests':
        return <ManagerRequests requests={requests} stockItems={stockItems} createRequest={createRequest} refreshRequests={refreshRequests} setToast={setToast} />;
      case 'expenses':
        return <ManagerExpenses expenses={expenses} logExpense={logExpense} deleteExpense={deleteExpense} onRefresh={refreshExpenses} setToast={setToast} />;
      case 'overview':
      default:
        return <ManagerOverview todaySalesTotal={todaySalesTotal} lowStockItemsCount={lowStockItemsCount} pendingRequestsCount={pendingRequestsCount} />;
    }
  };

  const renderHeader = () => (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
          <p className="hidden sm:block text-gray-500 text-sm">
            Welcome back{user?.name ? `, ${user.name}` : ''}! Take charge of your branch operations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadData}
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {error ? (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-gray-500">Loading branch data…</p>
          </div>
        ) : (
          <div className="space-y-8">
            {!bannerDismissed && lowStockItems.length > 0 ? (
              <LowStockBanner
                items={lowStockItems}
                onDismiss={() => setBannerDismissed(true)}
              />
            ) : null}
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

