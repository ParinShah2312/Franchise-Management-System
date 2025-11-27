import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Stock Requests' },
  { id: 'staff', label: 'My Staff' },
];

export default function FranchiseeDashboard() {
  const { user, getBranchId, logout } = useAuth();

  const [branchSummary, setBranchSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState({ manager: null, team: [] });
  const [requestAction, setRequestAction] = useState({ id: null, type: null });
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerSubmitting, setManagerSubmitting] = useState(false);
  const [managerForm, setManagerForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const branchId = getBranchId();

  const loadData = useCallback(async () => {
    if (!branchId) {
      setBranchSummary(null);
      setSales([]);
      setRequests([]);
      setStaff({ manager: null, team: [] });
      setLoading(false);
      setError('No branch is currently assigned to your account. Please contact support.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const metricsUrl = `/dashboard/branch/metrics${branchId ? `?branch_id=${branchId}` : ''}`;
      const salesUrl = `/sales${branchId ? `?branch_id=${branchId}` : ''}`;
      const requestsUrl = `/requests${branchId ? `?branch_id=${branchId}` : ''}`;
      const staffUrl = `/auth/profile`;

      const [metricsRes, salesRes, requestsRes, staffRes] = await Promise.allSettled([
        api.get(metricsUrl),
        api.get(salesUrl),
        api.get(requestsUrl),
        api.get(staffUrl),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setBranchSummary(metricsRes.value);
      } else {
        throw metricsRes.reason;
      }

      if (salesRes.status === 'fulfilled') {
        setSales(Array.isArray(salesRes.value) ? salesRes.value : []);
      }

      if (requestsRes.status === 'fulfilled') {
        setRequests(Array.isArray(requestsRes.value) ? requestsRes.value : []);
      }

      if (staffRes.status === 'fulfilled') {
        const payload = staffRes.value || {};
        setStaff({
          manager: payload.manager || null,
          team: Array.isArray(payload.staff) ? payload.staff : [],
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const pendingRequestsCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING').length,
    [requests],
  );

  const metrics = branchSummary || {};

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Revenue (MTD)</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">
            ₹{Number(metrics.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Total sales recorded this month.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inventory Value</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">
            ₹{Number(metrics.inventory_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Based on approved stock-in transactions.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">{metrics.pending_requests ?? 0}</h3>
          <p className="text-xs text-gray-500 mt-1">Awaiting your approval.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Quantity</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">
            {metrics.pending_items ?? 0}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Units requested by staff.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Recent Sales</h3>
          <button
            type="button"
            onClick={loadData}
            className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Refresh
          </button>
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
                sales.slice(0, 10).map((sale) => (
                  <tr key={sale.sale_id || sale.id}>
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
    </div>
  );

  const renderRequests = () => (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Stock Requests</h3>
        <button
          type="button"
          onClick={loadData}
          className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested On
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No stock requests yet.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.request_id}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {request.created_at ? new Date(request.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {request.items.map((item) => (
                      <div key={item.request_item_id}>
                        {item.stock_item_name || 'Item'} – {item.requested_quantity}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {request.status}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {request.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRequestAction(request.request_id, 'approve')}
                          disabled={
                            requestAction.id === request.request_id && requestAction.type === 'approve'
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-3 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:opacity-60"
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestAction(request.request_id, 'reject')}
                          disabled={
                            requestAction.id === request.request_id && requestAction.type === 'reject'
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">My Staff</h3>
          <p className="text-sm text-gray-500">Manage your branch manager and support staff.</p>
        </div>
        {!staff.manager ? (
          <button
            type="button"
            onClick={() => {
              setManagerForm({ name: '', email: '', password: '', phone: '' });

              setShowManagerModal(true);
            }}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Appoint Manager
          </button>
        ) : null}
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700">Branch Manager</h4>
        </div>
        <div className="px-4 py-4">
          {staff.manager ? (
            <div>
              <p className="text-sm font-semibold text-gray-800">{staff.manager.name}</p>
              <p className="text-sm text-gray-600">{staff.manager.email}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No manager assigned yet. Appoint one to oversee operations.</p>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Support Staff</h4>
          <span className="text-xs text-gray-500">{staff.team.length} staff members</span>
        </div>
        <div className="divide-y divide-gray-100">
          {staff.team.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No staff members linked to this branch.</p>
          ) : (
            staff.team.map((member) => (
              <div key={member.user_id} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-800">{member.name}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return renderRequests();
      case 'staff':
        return renderStaff();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  const handleRequestAction = async (requestId, action) => {
    setRequestAction({ id: requestId, type: action });
    try {
      await api.put(`/requests/${requestId}/${action}`);
      setToast({
        message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
        variant: 'success',
      });
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to update request.', variant: 'error' });
    } finally {
      setRequestAction({ id: null, type: null });
    }
  };

  const renderHeader = (showRefreshButton = true) => (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Franchisee Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.email || 'branch owner'}</p>
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
        ) : !branchSummary ? (
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
                  <span className="inline-flex items-center gap-2">
                    {tab.label}
                    {tab.id === 'requests' && pendingRequestsCount > 0 ? (
                      <span className="inline-flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full px-2">
                        {pendingRequestsCount}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </nav>

            {renderContent()}
          </div>
        )}
      </main>

      {showManagerModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Appoint Branch Manager</h3>
              <button
                type="button"
                onClick={() => !managerSubmitting && setShowManagerModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close manager modal"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setManagerSubmitting(true);
                try {
                  await api.post('/auth/register-manager', {
                    name: managerForm.name.trim(),
                    email: managerForm.email.trim(),
                    password: managerForm.password,
                    phone: managerForm.phone.trim(),
                    branch_id: branchId,
                  });
                  setShowManagerModal(false);

                  setToast({ message: 'Manager appointed successfully!', variant: 'success' });
                  await loadData();
                } catch (err) {
                  setToast({ message: err.message || 'Failed to appoint manager.', variant: 'error' });
                } finally {
                  setManagerSubmitting(false);
                }
              }}
            >
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_name">
                  Full Name*
                </label>
                <input
                  id="manager_name"
                  type="text"
                  required
                  value={managerForm.name}
                  onChange={(event) => setManagerForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Riya Sharma"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_email">
                  Email*
                </label>
                <input
                  id="manager_email"
                  type="email"
                  required
                  value={managerForm.email}
                  onChange={(event) => setManagerForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="manager@relay.com"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_password">
                  Temporary Password*
                </label>
                <input
                  id="manager_password"
                  type="password"
                  required
                  minLength={8}
                  value={managerForm.password}
                  onChange={(event) => setManagerForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="min 8 characters"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !managerSubmitting && setShowManagerModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={managerSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {managerSubmitting ? 'Saving…' : 'Appoint Manager'}
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