export default function ManagerOverview({ todaySalesTotal = 0, lowStockItemsCount = 0, pendingRequestsCount = 0 }) {
    return (
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
                <h3 className="text-2xl font-semibold text-gray-800 mt-2">{lowStockItemsCount}</h3>
                <p className="text-xs text-gray-500 mt-1">Items needing replenishment.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">Pending Requests</p>
                <h3 className="text-2xl font-semibold text-gray-800 mt-2">{pendingRequestsCount}</h3>
                <p className="text-xs text-gray-500 mt-1">Awaiting owner approval.</p>
            </div>
        </div>
    );
}
