import { ReportCard } from '../shared';

export default function FranchiseeReports({
  report,
  reportLoading,
  reportError,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onGenerate,
  onDownloadCSV,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Reports</h2>
        <p className="mt-1 text-sm text-gray-500">
          Generate monthly performance reports for your branch.
        </p>
      </div>
      <ReportCard
        report={report}
        loading={reportLoading}
        error={reportError}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
        onGenerate={onGenerate}
        onDownloadCSV={onDownloadCSV}
        showRoyalty={false}
      />
    </div>
  );
}
