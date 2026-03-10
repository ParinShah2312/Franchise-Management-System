import { useCallback, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useInventory } from '../hooks/useInventory';
import { useSales } from '../hooks/useSales';

import Toast from '../components/Toast';
import StaffInventory from '../components/staff/StaffInventory';
import StaffSales from '../components/staff/StaffSales';

const TABS = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
];

export default function StaffDashboard() {
  const { getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = useState('inventory');
  const [toast, setToast] = useState(null);

  const { inventoryItems, stockItems, loading: invLoading, error: invError, addInventory, refreshInventory } = useInventory(branchId);
  const { sales, products, loading: salesLoading, error: salesError, logSale, refreshSales } = useSales(branchId);

  const loading = !branchId ? false : (invLoading || salesLoading);
  const error = !branchId ? 'No branch assigned. Please contact your manager.' : (invError || salesError || '');

  const loadData = useCallback(() => {
    refreshInventory();
    refreshSales();
  }, [refreshInventory, refreshSales]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="text-sm text-gray-500">Manage branch inventory and log sales with live stock deductions.</p>
          </div>
          <div className="flex items-center gap-3">
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

      <main className="max-w-5xl mx-auto px-6 py-10">
        {error ? (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-gray-500">Loading dashboard…</p>
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

            {activeTab === 'inventory' ? (
              <StaffInventory
                inventoryItems={inventoryItems}
                stockItems={stockItems}
                addInventory={addInventory}
                onRefresh={refreshInventory}
                setToast={setToast}
              />
            ) : (
              <StaffSales
                sales={sales}
                products={products}
                logSale={logSale}
                onRefresh={refreshSales}
                setToast={setToast}
              />
            )}
          </div>
        )}
      </main>

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
