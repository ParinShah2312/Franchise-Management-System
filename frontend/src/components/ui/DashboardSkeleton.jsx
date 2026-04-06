import SkeletonCard from './SkeletonCard';
import SkeletonTable from './SkeletonTable';

export default function DashboardSkeleton({ statCount = 3, showTable = true }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${
        statCount === 3 ? 'md:grid-cols-3' : statCount === 5 ? 'lg:grid-cols-5' : 'md:grid-cols-3'
      }`}>
        {Array.from({ length: statCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {showTable && <SkeletonTable />}
    </div>
  );
}
