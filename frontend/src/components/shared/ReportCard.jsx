import StatCard from '../ui/StatCard';
import Table from '../ui/Table';
import { formatINR, formatINRDecimal } from '../../utils/formatters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2];

export default function ReportCard({
  report,
  loading,
  error,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onGenerate,
  onDownloadCSV,
  showRoyalty,
}) {
  const showRoyaltyColumns = showRoyalty && report?.royalty_configured === true;

  const tableHeaders = showRoyaltyColumns
    ? ['Branch', 'Total Sales', 'Franchisor Earned', 'Branch Owner Earned', 'Cut %']
    : ['Branch', 'Total Sales'];

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="report-month" className="text-sm font-medium text-gray-600">
            Month
          </label>
          <select
            id="report-month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="report-year" className="text-sm font-medium text-gray-600">
            Year
          </label>
          <select
            id="report-year"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {YEAR_OPTIONS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          id="report-generate-btn"
          onClick={onGenerate}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          {loading ? 'Generating…' : 'Generate Report'}
        </button>

        <button
          type="button"
          id="report-download-btn"
          onClick={onDownloadCSV}
          disabled={loading || !report}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          Download CSV
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500 text-sm">Generating report…</p>
        </div>
      )}

      {/* No Report Placeholder */}
      {!loading && !error && !report && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
          <p className="text-sm text-gray-500">
            Select a month and year, then click <span className="font-semibold">Generate Report</span> to view your report.
          </p>
        </div>
      )}

      {/* Report Content */}
      {!loading && report && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Sales"
              value={formatINR(report.total_sales)}
              accent="success"
            />
            <StatCard
              title="Total Expenses"
              value={formatINR(report.total_expenses)}
              accent="neutral"
            />
            <StatCard
              title="Profit / Loss"
              value={formatINR(report.profit_loss)}
              accent={report.profit_loss >= 0 ? 'success' : 'neutral'}
            />
          </div>

          {/* Branch Breakdown */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Branch Breakdown
            </h3>
            <Table
              headers={tableHeaders}
              data={report.branches || []}
              emptyMessage="No branch data available for this period."
              renderRow={(branch, idx) => (
                <tr key={branch.branch_id ?? idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{branch.branch_name}</td>
                  <td className="px-6 py-4 text-gray-700">{formatINRDecimal(branch.total_sales)}</td>
                  {showRoyaltyColumns && (
                    <>
                      <td className="px-6 py-4 text-gray-700">{formatINRDecimal(branch.franchisor_earned)}</td>
                      <td className="px-6 py-4 text-gray-700">{formatINRDecimal(branch.branch_owner_earned)}</td>
                      <td className="px-6 py-4 text-gray-700">{branch.franchisor_cut_pct}%</td>
                    </>
                  )}
                </tr>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
