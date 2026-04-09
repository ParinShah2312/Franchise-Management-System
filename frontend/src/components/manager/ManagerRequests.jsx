import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDateTime, formatNumber } from '../../utils';

const initialRequestForm = {
    stock_item_id: '',
    requested_quantity: '',
    note: '',
    estimated_unit_cost: '',
};

export default function ManagerRequests({ requests, stockItems, createRequest, refreshRequests, setToast }) {
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState(initialRequestForm);
    const [requestSubmitting, setRequestSubmitting] = useState(false);

    const handleCreateRequest = async (event) => {
        event.preventDefault();
        
        if (requestForm.estimated_unit_cost === '') {
            setRequestSubmitting(false);
            setToast({ message: 'Unit cost is required.', variant: 'error' });
            return;
        }

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

            await createRequest(requestPayload);
            setShowRequestModal(false);
            setToast({ message: 'Stock request submitted!', variant: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Failed to submit stock request.', variant: 'error' });
        } finally {
            setRequestSubmitting(false);
        }
    };

    return (
        <div>
            <div className="bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Stock Requests</h3>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={refreshRequests}
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
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 text-sm">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No stock requests submitted.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request.request_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatDateTime(request.created_at) || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {Array.isArray(request.items) && request.items.length > 0
                                                ? request.items.map((item) => (
                                                    <div key={item.request_item_id}>
                                                        {item.stock_item_name || 'Item'} — {formatNumber(item.requested_quantity)}
                                                    </div>
                                                ))
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">{request.status}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showRequestModal ? createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-6 max-h-[90dvh] overflow-y-auto mx-2">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manager_request_item">
                                    Stock Item*
                                </label>
                                <select
                                    id="manager_request_item"
                                    required
                                    value={requestForm.stock_item_id}
                                    onChange={(event) =>
                                        setRequestForm((prev) => ({ ...prev, stock_item_id: event.target.value }))
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manager_request_quantity">
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manager_request_cost">
                                    Unit Cost (₹)*
                                </label>
                                <input
                                    id="manager_request_cost"
                                    type="number"
                                    required
                                    min={0}
                                    step="0.01"
                                    value={requestForm.estimated_unit_cost}
                                    onChange={(event) =>
                                        setRequestForm((prev) => ({ ...prev, estimated_unit_cost: event.target.value }))
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 25.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manager_request_note">
                                    Note
                                </label>
                                <input
                                    id="manager_request_note"
                                    type="text"
                                    value={requestForm.note}
                                    onChange={(event) =>
                                        setRequestForm((prev) => ({ ...prev, note: event.target.value }))
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            , document.body) : null}
        </div>
    );
}
