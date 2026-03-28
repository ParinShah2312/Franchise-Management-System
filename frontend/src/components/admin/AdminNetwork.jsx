import Table from '../ui/Table';

export default function AdminNetwork({ flattenedBranches }) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Network overview</h2>
          <p className="text-sm text-gray-500">Active branches across all franchises</p>
        </div>
        <span className="text-sm text-gray-500">
          {flattenedBranches.length} branch{flattenedBranches.length === 1 ? '' : 'es'}
        </span>
      </div>

      {flattenedBranches.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-white py-12 text-center text-gray-500">
          No branches found yet.
        </div>
      ) : (
        <div className="mt-6">
          <Table
            headers={['Branch', 'Franchise', 'Location', 'Owner', 'Manager', 'Status']}
            data={flattenedBranches}
            renderRow={(row) => (
              <tr key={row.branchId} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.branchName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.franchiseName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.location || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.ownerName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.managerName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.status || '—'}</td>
              </tr>
            )}
          />
        </div>
      )}
    </section>
  );
}
