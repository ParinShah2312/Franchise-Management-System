import { formatINR, formatINRDecimal, formatDateTime } from '../../utils';

export default function FranchiseeOverview({ metrics, sales, onRefresh, branchSummary, branchSummaryLoading }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <p className="text-sm text-gray-500">Revenue (MTD)</p>
                    <h3 className="text-xl font-semibold text-gray-800 mt-2">
                        {formatINR(metrics.revenue)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Total sales recorded this month.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <p className="text-sm text-gray-500">Inventory Value</p>
                    <h3 className="text-xl font-semibold text-gray-800 mt-2">
                        {formatINR(metrics.inventory_value)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Based on approved stock-in transactions.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <h3 className="text-xl font-semibold text-gray-800 mt-2">{metrics.pending_requests ?? 0}</h3>
                    <p className="text-xs text-gray-500 mt-1">Awaiting your approval.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <p className="text-sm text-gray-500">Pending Quantity</p>
                    <h3 className="text-xl font-semibold text-gray-800 mt-2">
                        {metrics.pending_items ?? 0}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Units requested by staff.</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <p className="text-sm text-emerald-600">Royalty Earned (MTD)</p>
                    <h3 className="text-xl font-semibold text-gray-800 mt-2">
                        {branchSummaryLoading ? '…' : formatINRDecimal(branchSummary?.branch_owner_earned ?? 0)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Your share of this month's sales.</p>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Sales</h3>
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
                        <tbody className="bg-white divide-y divide-gray-100">
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
                                            {formatDateTime(sale.sale_datetime || sale.sale_date) || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                            {formatINRDecimal(sale.total_amount)}
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
}
