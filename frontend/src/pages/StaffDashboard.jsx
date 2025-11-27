import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
];

export default function StaffDashboard() {
  const { user, getBranchId, logout } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [salesSubmitting, setSalesSubmitting] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    stock_item_id: '',
    quantity: '',
    note: '',
  });
  const [saleForm, setSaleForm] = useState({
    sale_date: new Date().toISOString().slice(0, 10),
    payment_mode: 'Cash',
    items: [{ product_id: '', quantity: '' }],
  });
  const [toast, setToast] = useState(null);

  const branchId = getBranchId();

  const loadData = useCallback(async () => {
    if (!branchId) {
      setInventoryItems([]);
      setSales([]);
      setLoading(false);
      setError('No branch is currently assigned to your account. Please contact your manager.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const inventoryUrl = `/inventory${branchId ? `?branch_id=${branchId}` : ''}`;
      const salesUrl = `/sales${branchId ? `?branch_id=${branchId}` : ''}`;
      const stockItemsUrl = '/inventory/stock-items';
      const productsUrl = `/sales/products${branchId ? `?branch_id=${branchId}` : ''}`;

      const [inventoryRes, salesRes, stockItemsRes, productsRes] = await Promise.allSettled([
        api.get(inventoryUrl),
        api.get(salesUrl),
        api.get(stockItemsUrl),
        api.get(productsUrl),
      ]);

      if (inventoryRes.status === 'fulfilled') {
        setInventoryItems(Array.isArray(inventoryRes.value) ? inventoryRes.value : []);
      } else {
        throw inventoryRes.reason;
      }

      if (salesRes.status === 'fulfilled') {
        setSales(Array.isArray(salesRes.value) ? salesRes.value : []);
      }

      if (stockItemsRes.status === 'fulfilled') {
        setStockItems(Array.isArray(stockItemsRes.value) ? stockItemsRes.value : []);
      }

      if (productsRes.status === 'fulfilled') {
        setProducts(Array.isArray(productsRes.value) ? productsRes.value : []);
      }
    } catch (err) {
      const message = err.message || 'Failed to load staff dashboard data.';
      setError(message);
      setToast({ message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const quantity = Number(item.quantity || 0);
        const reorder = Number(item.reorder_level || 0);
        return reorder > 0 && quantity <= reorder;
      }),
    [inventoryItems],
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
              setDeliveryForm({ stock_item_id: '', quantity: '', note: '' });
              setShowDeliveryModal(true);
            }}
            className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
          >
            Record Delivery
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
                <tr key={item.branch_inventory_id || item.stock_item_id}>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.stock_item_name || item.item_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.unit_name || item.unit || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(item.quantity || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">{item.reorder_level != null ? Number(item.reorder_level).toLocaleString('en-IN') : '—'}</td>
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
                    {sale.sale_datetime || sale.sale_date
                      ? new Date(sale.sale_datetime || sale.sale_date).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ₹{Number(sale.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            <p className="text-gray-500 text-sm">
              Keep your branch stocked and sales updated in real time.
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

      {showDeliveryModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Record Stock Delivery</h3>
              <button
                type="button"
                onClick={() => !deliverySubmitting && setShowDeliveryModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close delivery modal"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setDeliverySubmitting(true);
                try {
                  const payload = {
                    stock_item_id: Number(deliveryForm.stock_item_id),
                    quantity: Number(deliveryForm.quantity),
                    note: deliveryForm.note || undefined,
                  };

                  if (!payload.stock_item_id) {
                    throw new Error('Please select a stock item.');
                  }

                  if (!payload.quantity || Number.isNaN(payload.quantity) || payload.quantity <= 0) {
                    throw new Error('Quantity must be greater than zero.');
                  }

                  await api.post(
                    `/inventory/stock-in${branchId ? `?branch_id=${branchId}` : ''}`,
                    payload,
                  );
                  setShowDeliveryModal(false);
                  setToast({ message: 'Delivery recorded successfully!', variant: 'success' });
                  await loadData();
                } catch (err) {
                  setToast({ message: err.message || 'Failed to record delivery.', variant: 'error' });
                } finally {
                  setDeliverySubmitting(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_delivery_item">
                  Stock Item*
                </label>
                <select
                  id="staff_delivery_item"
                  required
                  value={deliveryForm.stock_item_id}
                  onChange={(event) =>
                    setDeliveryForm((prev) => ({ ...prev, stock_item_id: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select item</option>
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_delivery_quantity">
                  Quantity Received*
                </label>
                <input
                  id="staff_delivery_quantity"
                  type="number"
                  required
                  min={1}
                  value={deliveryForm.quantity}
                  onChange={(event) =>
                    setDeliveryForm((prev) => ({ ...prev, quantity: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="staff_delivery_note">
                  Note
                </label>
                <textarea
                  id="staff_delivery_note"
                  rows={3}
                  value={deliveryForm.note}
                  onChange={(event) =>
                    setDeliveryForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Delivery reference or remarks"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !deliverySubmitting && setShowDeliveryModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deliverySubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow hover:bg-green-700 disabled:opacity-60"
                >
                  {deliverySubmitting ? 'Recording…' : 'Record Delivery'}
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
                  const salesEndpoint = branchId ? `/sales?branch_id=${branchId}` : '/sales';

                  const sanitizedItems = saleForm.items
                    .filter((item) => item.product_id && item.quantity)
                    .map((item) => ({
                      product_id: Number(item.product_id),
                      quantity: Number(item.quantity),
                    }));

                  if (sanitizedItems.length === 0) {
                    throw new Error('Add at least one product to the sale.');
                  }

                  await api.post(salesEndpoint, {
                    sale_date: saleForm.sale_date,
                    payment_mode: saleForm.payment_mode,
                    items: sanitizedItems,
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

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Products Sold*</p>
                {saleForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor={`sale_product_${index}`}>
                        Product
                      </label>
                      <select
                        id={`sale_product_${index}`}
                        required
                        value={item.product_id}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSaleForm((prev) => ({
                            ...prev,
                            items: prev.items.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, product_id: value } : row,
                            ),
                          }));
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor={`sale_quantity_${index}`}>
                          Qty
                        </label>
                        <input
                          id={`sale_quantity_${index}`}
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSaleForm((prev) => ({
                              ...prev,
                              items: prev.items.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, quantity: value } : row,
                              ),
                            }));
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSaleForm((prev) => ({
                            ...prev,
                            items: prev.items.filter((_, rowIndex) => rowIndex !== index),
                          }))
                        }
                        className="mt-5 inline-flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 h-9 w-9"
                        aria-label="Remove product"
                        disabled={saleForm.items.length === 1}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setSaleForm((prev) => ({
                      ...prev,
                      items: [...prev.items, { product_id: '', quantity: '' }],
                    }))
                  }
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Add Product
                </button>
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
