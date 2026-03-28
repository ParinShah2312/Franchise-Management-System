import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useStaffDashboard } from '../hooks/useStaffDashboard';

import Toast from '../components/Toast';
import Tabs from '../components/ui/Tabs';
import LowStockBanner from '../components/ui/LowStockBanner';
import StaffInventory from '../components/staff/StaffInventory';
import StaffSales from '../components/staff/StaffSales';

const TABS = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'sales', label: 'Sales' },
];

export default function StaffDashboard() {
  const { getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = useState('inventory');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    inventoryItems, stockItems, recordDelivery, refreshInventory,
    sales, products, logSale, refreshSales,
    loading, error, lowStockItems, loadData,
  } = useStaffDashboard(branchId);

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
            {!bannerDismissed && lowStockItems.length > 0 ? (
              <LowStockBanner
                items={lowStockItems}
                onDismiss={() => setBannerDismissed(true)}
              />
            ) : null}
            <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'inventory' ? (
              <StaffInventory
                inventoryItems={inventoryItems}
                stockItems={stockItems}
                recordDelivery={recordDelivery}
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
