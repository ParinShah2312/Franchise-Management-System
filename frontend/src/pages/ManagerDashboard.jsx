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
import { FaqAccordion } from '../components/shared';

const MANAGER_FAQ = [
  {
    question: "How do I record a stock delivery?",
    answer: "Go to the Inventory tab and click \"Record Delivery\". Select the stock item, enter the quantity received, and add an optional note. The inventory quantity updates immediately and an audit record is created.",
  },
  {
    question: "How do I log a sale?",
    answer: "Go to the Sales tab and click \"Log Sale\". Select the products and quantities sold, choose the payment mode (Cash, Card, or UPI), and confirm. Ingredient inventory is automatically deducted based on product recipes.",
  },
  {
    question: "How do I submit a stock purchase request?",
    answer: "Go to the Stock Requests tab and click \"New Request\". Select the stock item, enter the quantity needed and the estimated unit cost. The request is sent to the branch owner for approval. Once approved, stock is added to inventory automatically.",
  },
  {
    question: "What happens when a sale fails due to insufficient stock?",
    answer: "If a product's required ingredients are below the needed quantity, the sale will be rejected with an insufficient stock error. Record a delivery or submit a stock request to replenish the item before retrying the sale.",
  },
  {
    question: "How do I add a new staff member?",
    answer: "Go to the My Staff tab and click \"Add Staff\". Fill in the name, email, phone, and a temporary password. The staff member will be prompted to set a new password on their first login.",
  },
  {
    question: "How do I log a branch expense?",
    answer: "Go to the Expenses tab and click \"Log Expense\". Choose a category (Rent, Utilities, Salaries, etc.), set the date and amount, and add an optional description. The branch owner can view all logged expenses in their Reports tab.",
  },
];

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
        return (
          <>
            <ManagerOverview todaySalesTotal={todaySalesTotal} lowStockItemsCount={lowStockItemsCount} pendingRequestsCount={pendingRequestsCount} />
            <FaqAccordion items={MANAGER_FAQ} />
          </>
        );
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

