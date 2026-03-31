import Table from '../ui/Table';

export default function AdminNetwork({ flattenedBranches, onToggleStatus }) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Network overview</h2>
          <p className="text-sm text-gray-500">All branches across your franchises</p>
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
            headers={['Branch', 'Franchise', 'Location', 'Owner', 'Manager', 'Status', 'Actions']}
            data={flattenedBranches}
            renderRow={(row) => (
              <tr key={row.branchId} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.branchName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.franchiseName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.location || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.ownerName || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.managerName || '—'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    row.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {row.status || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                      const confirmed = window.confirm(
                        `Set branch "${row.branchName}" to ${newStatus}?`
                      );
                      if (confirmed) onToggleStatus(row.branchId, newStatus);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      row.status === 'ACTIVE'
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            )}
          />
        </div>
      )}
    </section>
  );
}
