import Table from '../ui/Table';
import { formatDate, formatINR } from '../../utils';

export default function AdminApplications({ applications, onOpenApplication }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pending applications</h2>
          <p className="text-sm text-gray-500">Review incoming franchise partner requests</p>
        </div>
        <span className="text-sm text-gray-500">
          {applications.length} application{applications.length === 1 ? '' : 's'}
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center text-gray-500">
          No pending applications at the moment.
        </div>
      ) : (
        <div className="mt-6">
          <Table
            headers={['Applicant', 'Location', 'Investment', 'Submitted', 'Actions']}
            data={applications}
            renderRow={(application) => (
              <tr key={application.application_id}>
                <td className="px-5 py-4 text-sm font-medium text-gray-900">
                  <div>{application.applicant_name || '—'}</div>
                  <div className="text-xs text-gray-500">{application.applicant_email || '—'}</div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{application.proposed_location || '—'}</td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {formatINR(application.investment_capacity)}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {formatDate(application.submitted_at) || '—'}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => onOpenApplication(application)}
                    className="btn-outline px-4 py-2 text-sm"
                  >
                    Review
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
