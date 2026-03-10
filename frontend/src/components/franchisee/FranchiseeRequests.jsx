import { useState } from 'react';

export default function FranchiseeRequests({ requests, updateRequestStatus, onRefresh, setToast }) {
    const [requestAction, setRequestAction] = useState({ id: null, type: null });

    const handleRequestAction = async (requestId, action) => {
        setRequestAction({ id: requestId, type: action });
        try {
            await updateRequestStatus(requestId, action);
            setToast({
                message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
                variant: 'success',
            });
        } catch (err) {
            setToast({ message: err.message || 'Failed to update request.', variant: 'error' });
        } finally {
            setRequestAction({ id: null, type: null });
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Stock Requests</h3>
                <button
                    type="button"
                    onClick={onRefresh}
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
}
