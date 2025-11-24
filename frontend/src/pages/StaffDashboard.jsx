import { useEffect, useState } from 'react';

import { api } from '../api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
];

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
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
      setInventoryItems([]);
      setSales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [inventoryResponse, salesResponse] = await Promise.allSettled([
        api.get('/inventory'),
        api.get('/sales'),
      ]);

      if (inventoryResponse.status === 'fulfilled') {
        setInventoryItems(Array.isArray(inventoryResponse.value) ? inventoryResponse.value : []);
      } else {
        throw inventoryResponse.reason;
      }

      if (salesResponse.status === 'fulfilled') {
        setSales(Array.isArray(salesResponse.value) ? salesResponse.value : []);
      }
    } catch (err) {
      const message = err.message || 'Failed to load staff dashboard data.';
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
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">{item.reorder_level ?? '—'}</td>
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
    if (activeTab === 'sales') {
      return renderSales();
    }
    return renderInventory();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="text-gray-500 text-sm">Access the tools you need to keep operations running.</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_inventory_item_name">
                  Item Name*
                </label>
                <input
                  id="staff_inventory_item_name"
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
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_inventory_category">
                  Category
                </label>
                <select
                  id="staff_inventory_category"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_inventory_quantity">
                    Quantity*
                  </label>
                  <input
                    id="staff_inventory_quantity"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_inventory_reorder">
                    Reorder Level*
                  </label>
                  <input
                    id="staff_inventory_reorder"
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
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_sale_date">
                  Sale Date*
                </label>
                <input
                  id="staff_sale_date"
                  type="date"
                  required
                  value={salesForm.sale_date}
                  onChange={(event) => setSalesForm((prev) => ({ ...prev, sale_date: event.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_sale_amount">
                  Amount*
                </label>
                <input
                  id="staff_sale_amount"
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
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_payment_mode">
                  Payment Mode*
                </label>
                <select
                  id="staff_payment_mode"
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
