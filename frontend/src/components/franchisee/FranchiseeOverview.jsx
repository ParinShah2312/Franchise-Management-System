export default function FranchiseeOverview({ metrics, sales, onRefresh }) {
    return (
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
}
