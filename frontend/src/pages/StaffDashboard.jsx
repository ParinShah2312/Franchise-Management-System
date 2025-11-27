import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
];

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Other'];

const initialDeliveryForm = {
  stock_item_id: '',
  quantity: '',
  note: '',
};

const createInitialSaleForm = () => ({
  sale_date: new Date().toISOString().slice(0, 10),
  payment_mode: PAYMENT_MODES[0],
  items: [{ product_id: '', quantity: '' }],
});

export default function StaffDashboard() {
  const { getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [inventoryItems, setInventoryItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  const [deliveryForm, setDeliveryForm] = useState(initialDeliveryForm);
  const [saleForm, setSaleForm] = useState(() => createInitialSaleForm());

  const loadData = useCallback(async () => {
    if (!branchId) {
      setInventoryItems([]);
      setSales([]);
      setProducts([]);
      setError('No branch assigned. Please contact your manager.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const inventoryUrl = `/inventory?branch_id=${branchId}`;
    const salesUrl = `/sales?branch_id=${branchId}`;
    const productsUrl = `/sales/products?branch_id=${branchId}`;

    try {
      const [inventoryRes, salesRes, stockItemsRes, productsRes] = await Promise.all([
        api.get(inventoryUrl),
        api.get(salesUrl),
        api.get('/inventory/stock-items'),
        api.get(productsUrl),
      ]);

      setInventoryItems(Array.isArray(inventoryRes) ? inventoryRes : []);
      setSales(Array.isArray(salesRes) ? salesRes : []);
      setStockItems(Array.isArray(stockItemsRes) ? stockItemsRes : []);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
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
  }, [loadData]);

  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const quantity = Number(item.quantity || 0);
        const reorder = Number(item.reorder_level || 0);
        return reorder > 0 && quantity <= reorder;
      }),
    [inventoryItems],
  );

  const closeSaleModal = () => {
    if (saleSubmitting) return;
    setShowSaleModal(false);
    setSaleForm(createInitialSaleForm());
  };

  const closeDeliveryModal = () => {
    if (deliverySubmitting) return;
    setShowDeliveryModal(false);
    setDeliveryForm(initialDeliveryForm);
  };

  const handleAddSaleRow = () => {
    setSaleForm((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: '' }],
    }));
  };

  const handleRemoveSaleRow = (index) => {
    setSaleForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const handleSaleItemChange = (index, key, value) => {
    setSaleForm((prev) => ({
      ...prev,
      items: prev.items.map((item, rowIndex) =>
        rowIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const submitDelivery = async (event) => {
    event.preventDefault();

    if (!branchId) {
      setToast({ message: 'No branch scope detected.', variant: 'error' });
      return;
    }

    const payload = {
      stock_item_id: Number(deliveryForm.stock_item_id),
      quantity: Number(deliveryForm.quantity),
      note: deliveryForm.note || undefined,
    };

    if (!payload.stock_item_id) {
      setToast({ message: 'Select a stock item before submitting.', variant: 'error' });
      return;
    }

    if (!payload.quantity || Number.isNaN(payload.quantity) || payload.quantity <= 0) {
      setToast({ message: 'Quantity must be greater than zero.', variant: 'error' });
      return;
    }

    setDeliverySubmitting(true);

    try {
      await api.post(`/inventory/stock-in?branch_id=${branchId}`, payload);
      setToast({ message: 'Delivery recorded successfully!', variant: 'success' });
      closeDeliveryModal();
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to record delivery.', variant: 'error' });
    } finally {
      setDeliverySubmitting(false);
    }
  };

  const submitSale = async (event) => {
    event.preventDefault();

    if (!branchId) {
      setToast({ message: 'No branch scope detected.', variant: 'error' });
      return;
    }

    const sanitizedItems = saleForm.items
      .filter((item) => item.product_id && item.quantity)
      .map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      }));

    if (sanitizedItems.length === 0) {
      setToast({ message: 'Add at least one product to the sale.', variant: 'error' });
      return;
    }

    if (sanitizedItems.some((item) => item.quantity <= 0 || Number.isNaN(item.quantity))) {
      setToast({ message: 'Sale quantities must be positive numbers.', variant: 'error' });
      return;
    }

    const payload = {
      sale_date: saleForm.sale_date,
      payment_mode: saleForm.payment_mode,
      items: sanitizedItems,
    };

    setSaleSubmitting(true);

    try {
      await api.post(`/sales?branch_id=${branchId}`, payload);
      setToast({ message: 'Sale logged successfully!', variant: 'success' });
      closeSaleModal();
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to log sale.', variant: 'error' });
    } finally {
      setSaleSubmitting(false);
    }
  };

  const renderInventoryTable = () => (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Inventory</h3>
          {lowStockItems.length > 0 ? (
            <p className="text-sm text-amber-600 font-medium mt-1">
              {lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'} at or below reorder level.
            </p>
          ) : null}
        </div>
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
              setDeliveryForm(initialDeliveryForm);
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Reorder Level
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {inventoryItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Inventory records will appear here once stocked.
                </td>
              </tr>
            ) : (
              inventoryItems.map((item) => {
                const quantity = Number(item.quantity || 0);
                const reorder = item.reorder_level != null ? Number(item.reorder_level) : null;
                const isLow = reorder != null && reorder > 0 && quantity <= reorder;

                return (
                  <tr
                    key={item.branch_inventory_id || `${item.branch_id}-${item.stock_item_id}`}
                    className={isLow ? 'bg-amber-50' : ''}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {item.stock_item_name || item.item_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.unit_name || item.unit || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {quantity.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">
                      {reorder != null ? reorder.toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSalesTable = () => (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Sales</h3>
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
              setSaleForm(createInitialSaleForm());
              setShowSaleModal(true);
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Payment Mode
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Logged sales will appear here.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.sale_id || sale.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {sale.sale_datetime || sale.sale_date
                      ? new Date(sale.sale_datetime || sale.sale_date).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{sale.payment_mode || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ₹{Number(sale.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

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

            {activeTab === 'inventory' ? renderInventoryTable() : renderSalesTable()}
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
                onClick={closeDeliveryModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close delivery modal"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={submitDelivery}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="delivery_stock_item">
                  Stock Item*
                </label>
                <select
                  id="delivery_stock_item"
                  required
                  value={deliveryForm.stock_item_id}
                  onChange={(event) =>
                    setDeliveryForm((prev) => ({ ...prev, stock_item_id: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select item</option>
                  {stockItems.map((item) => (
                    <option key={item.stock_item_id || item.id} value={item.stock_item_id || item.id}>
                      {item.name || item.stock_item_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="delivery_quantity">
                  Quantity Received*
                </label>
                <input
                  id="delivery_quantity"
                  type="number"
                  min={1}
                  required
                  value={deliveryForm.quantity}
                  onChange={(event) =>
                    setDeliveryForm((prev) => ({ ...prev, quantity: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="delivery_note">
                  Note
                </label>
                <textarea
                  id="delivery_note"
                  rows={3}
                  value={deliveryForm.note}
                  onChange={(event) =>
                    setDeliveryForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Reference or remarks"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeliveryModal}
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

      {showSaleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Log New Sale</h3>
              <button
                type="button"
                onClick={closeSaleModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close sale modal"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={submitSale}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sale_date">
                    Sale Date*
                  </label>
                  <input
                    id="sale_date"
                    type="date"
                    required
                    value={saleForm.sale_date}
                    onChange={(event) => setSaleForm((prev) => ({ ...prev, sale_date: event.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sale_payment_mode">
                    Payment Mode*
                  </label>
                  <select
                    id="sale_payment_mode"
                    required
                    value={saleForm.payment_mode}
                    onChange={(event) =>
                      setSaleForm((prev) => ({ ...prev, payment_mode: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {saleForm.items.map((item, index) => (
                  <div
                    key={`sale-item-${index}`}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-4 items-end"
                  >
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        htmlFor={`sale_product_${index}`}
                      >
                        Product*
                      </label>
                      <select
                        id={`sale_product_${index}`}
                        required
                        value={item.product_id}
                        onChange={(event) =>
                          handleSaleItemChange(index, 'product_id', event.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option
                            key={product.product_id || product.id}
                            value={product.product_id || product.id}
                          >
                            {product.product_name || product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        htmlFor={`sale_quantity_${index}`}
                      >
                        Quantity*
                      </label>
                      <input
                        id={`sale_quantity_${index}`}
                        type="number"
                        min={1}
                        required
                        value={item.quantity}
                        onChange={(event) =>
                          handleSaleItemChange(index, 'quantity', event.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="flex md:block justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveSaleRow(index)}
                        disabled={saleForm.items.length === 1}
                        className="w-full md:w-auto md:px-4 py-3 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSaleRow}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Add Product
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeSaleModal}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saleSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {saleSubmitting ? 'Logging…' : 'Log Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
