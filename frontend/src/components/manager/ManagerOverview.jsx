import StatCard from '../ui/StatCard';
import { formatINR } from '../../utils';

export default function ManagerOverview({ todaySalesTotal = 0, lowStockItemsCount = 0, pendingRequestsCount = 0 }) {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <StatCard
                title="Today's Sales"
                helper="Total sales recorded today."
                value={formatINR(todaySalesTotal)}
                accent="success"
            />
            <StatCard
                title="Low Stock Items"
                helper="Items needing replenishment."
                value={lowStockItemsCount}
                accent="neutral"
            />
            <StatCard
                title="Pending Requests"
                helper="Awaiting owner approval."
                value={pendingRequestsCount}
                accent="primary"
            />
        </div>
    );
}
