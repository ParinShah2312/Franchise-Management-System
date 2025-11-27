import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'staff', label: 'My Staff' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
  { id: 'requests', label: 'Stock Requests' },
];

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Other'];

const initialStaffForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
};

const initialInventoryForm = {
  stock_item_id: '',
  quantity: '',
  reorder_level: '',
};

const createInitialSaleForm = () => ({
  sale_date: new Date().toISOString().slice(0, 10),
  payment_mode: PAYMENT_MODES[0],
  items: [{ product_id: '', quantity: '' }],
});

const initialRequestForm = {
  stock_item_id: '',
  requested_quantity: '',
  note: '',
  estimated_unit_cost: '',
};

export default function ManagerDashboard() {
  const { user, getBranchId, logout } = useAuth();
  const branchId = getBranchId();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [staff, setStaff] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [inventorySubmitting, setInventorySubmitting] = useState(false);
  const [salesSubmitting, setSalesSubmitting] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const [staffForm, setStaffForm] = useState(initialStaffForm);
  const [staffErrors, setStaffErrors] = useState({});
  const [inventoryForm, setInventoryForm] = useState(initialInventoryForm);
  const [saleForm, setSaleForm] = useState(() => createInitialSaleForm());
  const [requestForm, setRequestForm] = useState(initialRequestForm);

  const loadData = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      setError('No branch is assigned to your account. Please contact your branch owner.');
      setStaff([]);
      setInventoryItems([]);
      setSales([]);
      setProducts([]);
      setRequests([]);
      setStockItems([]);
      return;
    }

    setLoading(true);
    setError('');

    const branchQuery = `?branch_id=${branchId}`;

    try {
      const [
        staffRes,
        inventoryRes,
        salesRes,
        requestsRes,
        stockItemsRes,
        productsRes,
      ] = await Promise.allSettled([
        api.get('/branch/staff'),
        api.get(`/inventory${branchQuery}`),
        api.get(`/sales${branchQuery}`),
        api.get(`/requests${branchQuery}`),
        api.get('/inventory/stock-items').catch(() => []),
        api.get(`/sales/products${branchQuery}`),
      ]);

      if (staffRes.status === 'fulfilled') {
        setStaff(Array.isArray(staffRes.value) ? staffRes.value : []);
      }

      if (inventoryRes.status === 'fulfilled') {
        setInventoryItems(Array.isArray(inventoryRes.value) ? inventoryRes.value : []);
      }

      if (salesRes.status === 'fulfilled') {
        setSales(Array.isArray(salesRes.value) ? salesRes.value : []);
      }

      if (requestsRes.status === 'fulfilled') {
        setRequests(Array.isArray(requestsRes.value) ? requestsRes.value : []);
      }

      if (stockItemsRes.status === 'fulfilled') {
        setStockItems(Array.isArray(stockItemsRes.value) ? stockItemsRes.value : []);
      }

      if (productsRes.status === 'fulfilled') {
        setProducts(Array.isArray(productsRes.value) ? productsRes.value : []);
      }
    } catch (err) {
      const message = err.message || 'Failed to load dashboard data.';
      setError(message);
      setToast({ message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === 'PENDING'),
    [requests],
  );

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
    if (salesSubmitting) {
      return;
    }
    setShowSalesModal(false);
    setSaleForm(createInitialSaleForm());
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

    setSalesSubmitting(true);

    try {
      await api.post(`/sales${branchId ? `?branch_id=${branchId}` : ''}`, payload);
      setToast({ message: 'Sale logged successfully!', variant: 'success' });
      setShowSalesModal(false);
      setSaleForm(createInitialSaleForm());
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to log sale.', variant: 'error' });
    } finally {
      setSalesSubmitting(false);
    }
  };

  const todaySalesTotal = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sales
      .filter((sale) => (sale.sale_datetime || sale.sale_date || '').slice(0, 10) === today)
      .reduce((total, sale) => total + Number(sale.total_amount || 0), 0);
  }, [sales]);

  const renderOverview = () => (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Today&apos;s Sales</p>
        <h3 className="text-2xl font-semibold text-gray-800 mt-2">
          ₹{Number(todaySalesTotal).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
        </h3>
        <p className="text-xs text-gray-500 mt-1">Total sales recorded today.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Low Stock Items</p>
        <h3 className="text-2xl font-semibold text-gray-800 mt-2">{lowStockItems.length}</h3>
        <p className="text-xs text-gray-500 mt-1">Items needing replenishment.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Pending Requests</p>
        <h3 className="text-2xl font-semibold text-gray-800 mt-2">{pendingRequests.length}</h3>
        <p className="text-xs text-gray-500 mt-1">Awaiting owner approval.</p>
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">My Staff</h3>
          <p className="text-sm text-gray-500">Team members assigned to your branch.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStaffForm(initialStaffForm);
            setStaffErrors({});
            setShowAddStaffModal(true);
          }}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Add Staff
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {staff.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No staff members added yet.
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">{member.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{member.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{member.role || 'STAFF'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
              setInventoryForm(initialInventoryForm);
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventoryItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No inventory records yet.
                </td>
              </tr>
            ) : (
              inventoryItems.map((item) => (
                <tr key={item.branch_inventory_id || item.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">{item.stock_item_name || item.item_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.unit_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {Number(item.quantity || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {item.reorder_level != null ? Number(item.reorder_level).toLocaleString('en-IN') : '—'}
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
              setSaleForm(createInitialSaleForm());
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
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
                <tr key={sale.sale_id || sale.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {(sale.sale_datetime || sale.sale_date)
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

  const renderRequests = () => (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Stock Requests</h3>
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
              setRequestForm(initialRequestForm);
              setShowRequestModal(true);
            }}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            New Request
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No stock requests submitted.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.request_id}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {request.created_at ? new Date(request.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {Array.isArray(request.items) && request.items.length > 0
                      ? request.items.map((item) => (
                          <div key={item.request_item_id}>
                            {item.stock_item_name || 'Item'} — {item.requested_quantity}
                          </div>
                        ))
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{request.status}</td>
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
      case 'requests':
        return renderRequests();
      case 'overview':
      default:
        return renderOverview();
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

  const validateStaffForm = () => {
    const errors = {};

    if (staffForm.phone.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits.';
    }

    return errors;
  };

  const handleAddStaff = async (event) => {
    event.preventDefault();

    const validationErrors = validateStaffForm();
    if (Object.keys(validationErrors).length > 0) {
      setStaffErrors(validationErrors);
      return;
    }

    setStaffErrors({});
    setStaffSubmitting(true);

    try {
      await api.post('/auth/register-staff', {
        ...staffForm,
        branch_id: branchId,
      });
      setShowAddStaffModal(false);
      setToast({ message: 'Staff member added successfully!', variant: 'success' });
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to add staff member.', variant: 'error' });
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleAddInventory = async (event) => {
    event.preventDefault();
    setInventorySubmitting(true);

    try {
      const payload = {
        stock_item_id: inventoryForm.stock_item_id ? Number(inventoryForm.stock_item_id) : null,
        quantity: Number(inventoryForm.quantity || 0),
        reorder_level: Number(inventoryForm.reorder_level || 0),
      };

      if (!payload.stock_item_id) {
        throw new Error('Select a stock item to add.');
      }

      await api.post(`/inventory${branchId ? `?branch_id=${branchId}` : ''}`, payload);
      setShowInventoryModal(false);
      setToast({ message: 'Inventory item added successfully!', variant: 'success' });
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to add inventory item.', variant: 'error' });
    } finally {
      setInventorySubmitting(false);
    }
  };

  const handleLogSale = async (event) => {
    event.preventDefault();
    setSalesSubmitting(true);

    try {
      await api.post(`/sales${branchId ? `?branch_id=${branchId}` : ''}`, {
        sale_date: saleForm.sale_date,
        total_amount: Number(saleForm.total_amount || 0),
        payment_mode: saleForm.payment_mode,
        items: [{
          product_id: 1,
          quantity: 1,
        }],
      });
      setShowSaleModal(false);
      setToast({ message: 'Sale logged successfully!', variant: 'success' });
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to log sale.', variant: 'error' });
    } finally {
      setSalesSubmitting(false);
    }
  };

  const handleCreateRequest = async (event) => {
    event.preventDefault();
    setRequestSubmitting(true);

    try {
      const quantity = Number(requestForm.requested_quantity || 0);
      const requestPayload = {
        note: requestForm.note || undefined,
        items: [
          {
            stock_item_id: Number(requestForm.stock_item_id),
            requested_quantity: quantity,
            estimated_unit_cost:
              requestForm.estimated_unit_cost !== ''
                ? Number(requestForm.estimated_unit_cost)
                : undefined,
          },
        ],
      };

      await api.post(`/requests${branchId ? `?branch_id=${branchId}` : ''}`, requestPayload);
      setShowRequestModal(false);
      setToast({ message: 'Stock request submitted!', variant: 'success' });
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to submit stock request.', variant: 'error' });
    } finally {
      setRequestSubmitting(false);
    }
  };

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

      {showAddStaffModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Add Staff Member</h3>
              <button
                type="button"
                onClick={() => !staffSubmitting && setShowAddStaffModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close staff modal"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleAddStaff}>
              <div>
                <label className="label" htmlFor="manager_staff_name">
                  Full Name*
                </label>
                <input
                  id="manager_staff_name"
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(event) => setStaffForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="input-field"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="label" htmlFor="manager_staff_email">
                  Email*
                </label>
                <input
                  id="manager_staff_email"
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(event) => setStaffForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="input-field"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="label" htmlFor="manager_staff_phone">
                  Phone*
                </label>
                <input
                  id="manager_staff_phone"
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={staffForm.phone}
                  onChange={(event) => {
                    const sanitized = event.target.value.replace(/\D/g, '').slice(0, 10);
                    setStaffForm((prev) => ({ ...prev, phone: sanitized }));
                  }}
                  className={`input-field ${staffErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  placeholder="9876543210"
                />
                {staffErrors.phone ? (
                  <p className="mt-1 text-sm text-red-600">{staffErrors.phone}</p>
                ) : null}
              </div>

              <div>
                <label className="label" htmlFor="manager_staff_password">
                  Temporary Password*
                </label>
                <input
                  id="manager_staff_password"
                  type="password"
                  required
                  minLength={8}
                  value={staffForm.password}
                  onChange={(event) => setStaffForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="input-field"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!staffSubmitting) {
                      setShowAddStaffModal(false);
                      setStaffErrors({});
                    }
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {staffSubmitting ? 'Adding…' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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

            <form className="space-y-4" onSubmit={handleAddInventory}>
              <div>
                <label className="label" htmlFor="manager_inventory_stock_item">
                  Stock Item*
                </label>
                <select
                  id="manager_inventory_stock_item"
                  required
                  value={inventoryForm.stock_item_id}
                  onChange={(event) =>
                    setInventoryForm((prev) => ({ ...prev, stock_item_id: event.target.value }))
                  }
                  className="input-field"
                  disabled={inventorySubmitting}
                >
                  <option value="">Select item</option>
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="manager_inventory_quantity">
                    Quantity*
                  </label>
                  <input
                    id="manager_inventory_quantity"
                    type="number"
                    required
                    min={0}
                    value={inventoryForm.quantity}
                    onChange={(event) =>
                      setInventoryForm((prev) => ({ ...prev, quantity: event.target.value }))
                    }
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="manager_inventory_reorder">
                    Reorder Level
                  </label>
                  <input
                    id="manager_inventory_reorder"
                    type="number"
                    min={0}
                    value={inventoryForm.reorder_level}
                    onChange={(event) =>
                      setInventoryForm((prev) => ({ ...prev, reorder_level: event.target.value }))
                    }
                    className="input-field"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manager_sale_date">
                    Sale Date*
                  </label>
                  <input
                    id="manager_sale_date"
                    type="date"
                    required
                    value={saleForm.sale_date}
                    onChange={(event) =>
                      setSaleForm((prev) => ({ ...prev, sale_date: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manager_sale_payment_mode">
                    Payment Mode*
                  </label>
                  <select
                    id="manager_sale_payment_mode"
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
                    key={`manager-sale-item-${index}`}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-4 items-end"
                  >
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        htmlFor={`manager_sale_product_${index}`}
                      >
                        Product*
                      </label>
                      <select
                        id={`manager_sale_product_${index}`}
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
                        htmlFor={`manager_sale_quantity_${index}`}
                      >
                        Quantity*
                      </label>
                      <input
                        id={`manager_sale_quantity_${index}`}
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

      {showRequestModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">New Stock Request</h3>
              <button
                type="button"
                onClick={() => !requestSubmitting && setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close request modal"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateRequest}>
              <div>
                <label className="label" htmlFor="manager_request_item">
                  Stock Item*
                </label>
                <select
                  id="manager_request_item"
                  required
                  value={requestForm.stock_item_id}
                  onChange={(event) =>
                    setRequestForm((prev) => ({ ...prev, stock_item_id: event.target.value }))
                  }
                  className="input-field"
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
                <label className="label" htmlFor="manager_request_quantity">
                  Quantity*
                </label>
                <input
                  id="manager_request_quantity"
                  type="number"
                  required
                  min={1}
                  value={requestForm.requested_quantity}
                  onChange={(event) =>
                    setRequestForm((prev) => ({ ...prev, requested_quantity: event.target.value }))
                  }
                  className="input-field"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="label" htmlFor="manager_request_cost">
                  Estimated Unit Cost
                </label>
                <input
                  id="manager_request_cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={requestForm.estimated_unit_cost}
                  onChange={(event) =>
                    setRequestForm((prev) => ({ ...prev, estimated_unit_cost: event.target.value }))
                  }
                  className="input-field"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="label" htmlFor="manager_request_note">
                  Note
                </label>
                <textarea
                  id="manager_request_note"
                  rows={3}
                  value={requestForm.note}
                  onChange={(event) =>
                    setRequestForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                  className="input-field"
                  placeholder="Any additional context"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !requestSubmitting && setShowRequestModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {requestSubmitting ? 'Submitting…' : 'Submit Request'}
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
