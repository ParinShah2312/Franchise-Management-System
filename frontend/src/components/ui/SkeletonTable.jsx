export default function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-8 bg-gray-200 rounded w-24" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-3 bg-gray-100 rounded"
                style={{ flex: j === 0 ? 2 : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
