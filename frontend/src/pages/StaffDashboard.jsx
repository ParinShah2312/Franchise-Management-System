import { useState } from 'react';
import { usePersistedTab } from '../hooks/usePersistedTab';

import { useAuth } from '../context/AuthContext';
import { useStaffDashboard } from '../hooks/useStaffDashboard';

import Toast from '../components/Toast';
import Tabs from '../components/ui/Tabs';
import LowStockBanner from '../components/ui/LowStockBanner';
import StaffInventory from '../components/staff/StaffInventory';
import StaffSales from '../components/staff/StaffSales';
import { FaqAccordion } from '../components/shared';
import SkeletonTable from '../components/ui/SkeletonTable';
import ErrorState from '../components/ui/ErrorState';

const STAFF_FAQ = [
  {
    question: "How do I record a stock delivery?",
    answer: "Go to the Inventory tab and click \"Record Delivery\". Select the stock item, enter the quantity received, and add an optional note. The inventory quantity updates immediately, and an audit record is created for the manager.",
  },
  {
    question: "How do I log a sale?",
    answer: "Go to the Sales tab and click \"Log Sale\". Select the products, choose the payment mode (Cash, Card, or UPI), and confirm. Ingredient inventory is automatically deducted based on product recipes.",
  },
  {
    question: "What happens when a sale fails due to insufficient stock?",
    answer: "If a product's required ingredients are below the needed quantity, the sale will be rejected with an insufficient stock error. Record a delivery to replenish the item before retrying the sale. You should notify your manager to submit a purchase request if you don't have stock on hand.",
  },
  {
    question: "Why can't I edit or delete sales/deliveries?",
    answer: "Support staff only have permission to create records. If you make a mistake, notify your branch manager or owner—they have the necessary permissions to delete or correct erroneous records.",
  },
];


const TABS = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'sales', label: 'Sales' },
];

export default function StaffDashboard() {
  const { getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = usePersistedTab('relay_tab_staff', 'inventory');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    inventoryItems, stockItems, recordDelivery, refreshInventory, invLoading,
    sales, products, logSale, refreshSales, salesLoading,
    loading, error, lowStockItems, loadData,
  } = useStaffDashboard(branchId);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="hidden sm:block text-sm text-gray-500">Manage branch inventory and log sales with live stock deductions.</p>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {error && (inventoryItems.length > 0 || sales.length > 0) ? (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : null}

        {error && inventoryItems.length === 0 && sales.length === 0 ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="space-y-8 animate-fade-in">
            {!bannerDismissed && lowStockItems.length > 0 ? (
              <LowStockBanner
                items={lowStockItems}
                onDismiss={() => setBannerDismissed(true)}
              />
            ) : null}
            <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'inventory' ? (
              <>
                {invLoading ? (
                  <SkeletonTable rows={5} cols={4} />
                ) : (
                  <StaffInventory
                    inventoryItems={inventoryItems}
                    stockItems={stockItems}
                    recordDelivery={recordDelivery}
                    onRefresh={refreshInventory}
                    setToast={setToast}
                  />
                )}
                <FaqAccordion items={STAFF_FAQ} />
              </>
            ) : (
              salesLoading ? (
                <SkeletonTable rows={5} cols={3} />
              ) : (
                <StaffSales
                  sales={sales}
                  products={products}
                  logSale={logSale}
                  onRefresh={refreshSales}
                  setToast={setToast}
                />
              )
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
