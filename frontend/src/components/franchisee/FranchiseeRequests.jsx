import { useState } from 'react';
import { formatDateTime, formatNumber, formatINR } from '../../utils';

export default function FranchiseeRequests({ requests, updateRequestStatus, onRefresh, setToast }) {
    const [requestAction, setRequestAction] = useState({ id: null, type: null });
    const [optimisticStatuses, setOptimisticStatuses] = useState({});

    const handleRequestAction = async (requestId, action) => {
        // Optimistically update the UI immediately
        setOptimisticStatuses(prev => ({
            ...prev,
            [requestId]: action === 'approve' ? 'APPROVED' : 'REJECTED',
        }));
        setRequestAction({ id: requestId, type: action });
        try {
            await updateRequestStatus(requestId, action);
            setToast({
                message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
                variant: 'success',
            });
            if (onRefresh) await onRefresh();
        } catch (err) {
            setToast({ message: err.message || 'Failed to update request.', variant: 'error' });
        } finally {
            setOptimisticStatuses(prev => {
                const next = { ...prev };
                delete next[requestId];
                return next;
            });
            setRequestAction({ id: null, type: null });
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Stock Requests</h3>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                    Refresh
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Requested On
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Items
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                                    No stock requests yet.
                                </td>
                            </tr>
                        ) : (
                            requests.map((request) => {
                                const displayedStatus = optimisticStatuses[request.request_id] ?? request.status;
                                return (
                                <tr key={request.request_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {formatDateTime(request.created_at) || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="space-y-1">
                                            {request.items.map((item) => {
                                                const lineTotal = item.estimated_unit_cost != null
                                                    ? item.requested_quantity * item.estimated_unit_cost
                                                    : null;
                                                return (
                                                    <div key={item.request_item_id} className="text-xs text-gray-600">
                                                        <span className="font-medium">{item.stock_item_name || 'Item'}</span>
                                                        {' · '}
                                                        <span>{formatNumber(item.requested_quantity)} {item.unit_name || 'units'}</span>
                                                        {item.estimated_unit_cost != null && (
                                                            <>
                                                                {' · '}
                                                                <span>{formatINR(item.estimated_unit_cost)}/unit</span>
                                                                {' · '}
                                                                <span className="font-medium text-gray-800">{formatINR(lineTotal)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        {displayedStatus}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        {displayedStatus === 'PENDING' ? (
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
                            );
                        })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
