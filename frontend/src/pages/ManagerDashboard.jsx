import { useCallback, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { useInventory } from '../hooks/useInventory';
import { useSales } from '../hooks/useSales';
import { useRequests } from '../hooks/useRequests';
import Toast from '../components/Toast';

import ManagerOverview from '../components/manager/ManagerOverview';
import ManagerStaff from '../components/manager/ManagerStaff';
import ManagerInventory from '../components/manager/ManagerInventory';
import ManagerSales from '../components/manager/ManagerSales';
import ManagerRequests from '../components/manager/ManagerRequests';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'staff', label: 'My Staff' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
  { id: 'requests', label: 'Stock Requests' },
];

export default function ManagerDashboard() {
  const { user, getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const { staff, loading: staffLoading, error: staffError, addStaff, refreshStaff } = useStaff(branchId);
  const { inventoryItems, stockItems, loading: invLoading, error: invError, addInventory, refreshInventory } = useInventory(branchId);
  const { sales, products, loading: salesLoading, error: salesError, logSale, refreshSales } = useSales(branchId);
  const { requests, loading: reqLoading, error: reqError, createRequest, refreshRequests } = useRequests(branchId);

  const loading = !branchId ? false : (staffLoading || invLoading || salesLoading || reqLoading);
  const error = !branchId ? 'No branch is assigned to your account. Please contact your branch owner.' : (staffError || invError || salesError || reqError || '');

  const loadData = useCallback(() => {
    refreshStaff();
    refreshInventory();
    refreshSales();
    refreshRequests();
  }, [refreshStaff, refreshInventory, refreshSales, refreshRequests]);

  const pendingRequestsCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING').length,
    [requests]
  );

  const lowStockItemsCount = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const quantity = Number(item.quantity || 0);
        const reorder = Number(item.reorder_level || 0);
        return reorder > 0 && quantity <= reorder;
      }).length,
    [inventoryItems]
  );

  const todaySalesTotal = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sales
      .filter((sale) => (sale.sale_datetime || sale.sale_date || '').slice(0, 10) === today)
      .reduce((total, sale) => total + Number(sale.total_amount || 0), 0);
  }, [sales]);

  const renderContent = () => {
    switch (activeTab) {
      case 'staff':
        return <ManagerStaff staff={staff} addStaff={addStaff} setToast={setToast} />;
      case 'inventory':
        return <ManagerInventory inventoryItems={inventoryItems} stockItems={stockItems} addInventory={addInventory} refreshInventory={refreshInventory} setToast={setToast} />;
      case 'sales':
        return <ManagerSales sales={sales} products={products} logSale={logSale} refreshSales={refreshSales} setToast={setToast} />;
      case 'requests':
        return <ManagerRequests requests={requests} stockItems={stockItems} createRequest={createRequest} refreshRequests={refreshRequests} setToast={setToast} />;
      case 'overview':
      default:
        return <ManagerOverview todaySalesTotal={todaySalesTotal} lowStockItemsCount={lowStockItemsCount} pendingRequestsCount={pendingRequestsCount} />;
    }
  };

  const renderHeader = () => (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Welcome back{user?.name ? `, ${user.name}` : ''}! Take charge of your branch operations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
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

      <main className="max-w-6xl mx-auto px-6 py-10">
        {error ? (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-gray-500">Loading branch data…</p>
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
                  {tab.label}
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
