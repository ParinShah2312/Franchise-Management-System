import { useEffect, useMemo, useState } from 'react';

import { api } from '../api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'staff', label: 'My Staff' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
];

export default function FranchiseeDashboard() {
  const { user, logout } = useAuth();
  const [franchise, setFranchise] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    item_name: '',
    category: 'General',
    quantity: '',
    reorder_level: '',
  });
  const [inventorySubmitting, setInventorySubmitting] = useState(false);
  const [salesForm, setSalesForm] = useState({
    sale_date: new Date().toISOString().slice(0, 10),
    total_amount: '',
    payment_mode: 'Cash',
  });
  const [salesSubmitting, setSalesSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const franchiseId = user?.franchise_id;

  const loadData = async () => {
    if (!franchiseId) {
      setFranchise(null);
      setInventoryItems([]);
      setSales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [franchiseResponse, inventoryResponse, salesResponse] = await Promise.allSettled([
        api.get('/franchises'),
        api.get('/inventory'),
        api.get('/sales'),
      ]);

      if (franchiseResponse.status === 'fulfilled') {
        const list = Array.isArray(franchiseResponse.value) ? franchiseResponse.value : [];
        // backend returns list with single item for franchisees
        setFranchise(list.find((item) => item.id === franchiseId) || list[0] || null);
      } else {
        throw franchiseResponse.reason;
      }

      if (inventoryResponse.status === 'fulfilled') {
        setInventoryItems(Array.isArray(inventoryResponse.value) ? inventoryResponse.value : []);
      }

      if (salesResponse.status === 'fulfilled') {
        setSales(Array.isArray(salesResponse.value) ? salesResponse.value : []);
      }
    } catch (err) {
      const message = err.message || 'Failed to load dashboard data.';
      setError(message);
      setToast({ message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [franchiseId]);

  const isPending = franchise?.status === 'pending';

  const totalInventoryValue = useMemo(() => {
    return inventoryItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  }, [inventoryItems]);

  const totalSalesAmount = useMemo(() => {
    return sales.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
  }, [sales]);

  const renderOverview = () => (
    <div className="space-y-6">
      {isPending ? (
        <div className="border border-yellow-200 bg-yellow-50 text-yellow-800 px-6 py-4 rounded-xl">
          <h3 className="font-semibold text-lg">Your franchise is pending approval</h3>
          <p className="text-sm mt-1">
            The admin team is reviewing your application. You&apos;ll gain full access once your
            franchise is approved.
          </p>
        </div>
      ) : (
        <div className="border border-green-200 bg-green-50 text-green-800 px-6 py-4 rounded-xl">
          <h3 className="font-semibold text-lg">Franchise Active</h3>
          <p className="text-sm mt-1">You now have access to manage inventory and sales.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Franchise</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">{franchise?.franchise_name || '—'}</h3>
          <p className="text-sm text-gray-500 mt-1">{franchise?.location || 'Location pending'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inventory Value</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">
            ${totalInventoryValue.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Across {inventoryItems.length} items</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Sales This Franchise</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">
            ${totalSalesAmount.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{sales.length} recorded entries</p>
        </div>
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Staff Management</h3>
      <p className="text-sm">
        Staff onboarding is coming soon. Once enabled, you&apos;ll manage team members linked to your
        franchise here.
      </p>
    </div>
  );

  const renderInventory = () => (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Inventory Items</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setInventoryForm({ item_name: '', category: 'General', quantity: '', reorder_level: '' });
              setShowInventoryModal(true);
            }}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Add Item
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reorder Level
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventoryItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No inventory items recorded yet.
                </td>
              </tr>
            ) : (
              inventoryItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.item_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.category || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {item.reorder_level ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Sales History</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setSalesForm({
                sale_date: new Date().toISOString().slice(0, 10),
                total_amount: '',
                payment_mode: 'Cash',
              });
              setShowSalesModal(true);
            }}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Log Sale
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Mode
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No sales recorded yet.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ${Number(sale.total_amount || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{sale.payment_mode || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'staff':
        return renderStaff();
      case 'inventory':
        return renderInventory();
      case 'sales':
        return renderSales();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  const renderHeader = (showRefreshButton = true) => (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Franchisee Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Welcome back, {user?.email || 'franchisee'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
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

  if (!loading && franchise && isPending) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader(false)}
        <main className="max-w-4xl mx-auto px-6 py-16 flex items-center justify-center">
          <div className="max-w-2xl w-full border border-yellow-200 bg-yellow-50 text-yellow-800 px-8 py-12 rounded-2xl shadow-sm text-center">
            <h2 className="text-2xl font-semibold">Your franchise application is pending</h2>
            <p className="mt-4 text-sm md:text-base">
              Thank you for submitting your documents. Our admin team is currently reviewing your
              application. You’ll gain full access to the dashboard once your franchise is approved.
            </p>
            <p className="mt-2 text-sm text-yellow-700">
              Feel free to reach out to support if you have any questions in the meantime.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader(true)}

      <main className="max-w-6xl mx-auto px-6 py-10">
        {error ? (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-gray-500">Loading your franchise data…</p>
          </div>
        ) : !franchise ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Franchise information unavailable</h3>
            <p className="text-sm">
              We couldn’t find a franchise linked to your account. Please contact support for
              assistance.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <nav className="flex space-x-3">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    activeTab === tab.id
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

      {showInventoryModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Add Inventory Item</h3>
              <button
                type="button"
                onClick={() => !inventorySubmitting && setShowInventoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close inventory modal"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setInventorySubmitting(true);
                try {
                  const payload = {
                    item_name: inventoryForm.item_name.trim(),
                    category: inventoryForm.category,
                    quantity: Number(inventoryForm.quantity),
                    reorder_level: Number(inventoryForm.reorder_level),
                  };

                  await api.post('/inventory', payload);
                  setShowInventoryModal(false);
                  setToast({ message: 'Inventory item added successfully!', variant: 'success' });
                  await loadData();
                } catch (err) {
                  setToast({ message: err.message || 'Failed to add inventory item.', variant: 'error' });
                } finally {
                  setInventorySubmitting(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="inventory_item_name">
                  Item Name*
                </label>
                <input
                  id="inventory_item_name"
                  type="text"
                  required
                  value={inventoryForm.item_name}
                  onChange={(event) =>
                    setInventoryForm((prev) => ({ ...prev, item_name: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Espresso Beans"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="inventory_category">
                  Category
                </label>
                <select
                  id="inventory_category"
                  value={inventoryForm.category}
                  onChange={(event) =>
                    setInventoryForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Edibles">Edibles</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Cleaning Supplies">Cleaning Supplies</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="inventory_quantity">
                    Quantity*
                  </label>
                  <input
                    id="inventory_quantity"
                    type="number"
                    required
                    min={0}
                    value={inventoryForm.quantity}
                    onChange={(event) =>
                      setInventoryForm((prev) => ({ ...prev, quantity: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="inventory_reorder_level">
                    Reorder Level*
                  </label>
                  <input
                    id="inventory_reorder_level"
                    type="number"
                    required
                    min={0}
                    value={inventoryForm.reorder_level}
                    onChange={(event) =>
                      setInventoryForm((prev) => ({ ...prev, reorder_level: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !inventorySubmitting && setShowInventoryModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inventorySubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {inventorySubmitting ? 'Adding…' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showSalesModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Log New Sale</h3>
              <button
                type="button"
                onClick={() => !salesSubmitting && setShowSalesModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close sales modal"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setSalesSubmitting(true);
                try {
                  await api.post('/sales', {
                    sale_date: salesForm.sale_date,
                    total_amount: Number(salesForm.total_amount),
                    payment_mode: salesForm.payment_mode,
                  });
                  setShowSalesModal(false);
                  setToast({ message: 'Sale logged successfully!', variant: 'success' });
                  await loadData();
                } catch (err) {
                  setToast({ message: err.message || 'Failed to log sale.', variant: 'error' });
                } finally {
                  setSalesSubmitting(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sale_date">
                  Sale Date*
                </label>
                <input
                  id="sale_date"
                  type="date"
                  required
                  value={salesForm.sale_date}
                  onChange={(event) => setSalesForm((prev) => ({ ...prev, sale_date: event.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sale_amount">
                  Amount*
                </label>
                <input
                  id="sale_amount"
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={salesForm.total_amount}
                  onChange={(event) =>
                    setSalesForm((prev) => ({ ...prev, total_amount: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="250.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="payment_mode">
                  Payment Mode*
                </label>
                <select
                  id="payment_mode"
                  required
                  value={salesForm.payment_mode}
                  onChange={(event) =>
                    setSalesForm((prev) => ({ ...prev, payment_mode: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !salesSubmitting && setShowSalesModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={salesSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {salesSubmitting ? 'Logging…' : 'Log Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
    </div>
  );
}