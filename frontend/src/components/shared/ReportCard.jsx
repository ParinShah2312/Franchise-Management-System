import StatCard from '../ui/StatCard';
import Table from '../ui/Table';
import { formatINR, formatINRDecimal } from '../../utils/formatters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2];

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ReportPDF from './ReportPDF';
import ReportBranchTable from './ReportBranchTable';

export default function ReportCard({
  report,
  loading,
  error,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onGenerate,
  generatedBy,
  showRoyalty,
  isFranchisee = false,
}) {
  const showRoyaltyColumns = showRoyalty && report?.royalty_configured === true;

  const tableHeaders = showRoyaltyColumns
    ? ['Branch', 'Total Sales', 'Franchisor Earned', 'Branch Owner Earned', 'Cut %', '']
    : ['Branch', 'Total Sales', ''];

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

        {!report ? (
          <span
            className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-2 text-sm font-medium text-gray-400 cursor-default select-none"
            title="Generate a report first to enable PDF download"
          >
            Download PDF
          </span>
        ) : (
          <PDFDownloadLink
            document={
              <ReportPDF 
                report={report} 
                selectedMonth={selectedMonth} 
                selectedYear={selectedYear} 
                showRoyalty={showRoyalty} 
                generatedBy={generatedBy} 
              />
            }
            fileName={report.filename ? `${report.filename}.pdf` : `Relay_Report_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.pdf`}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors inline-block text-center"
          >
            {({ loading: pdfLoading }) => (pdfLoading ? 'Loading Document…' : 'Download PDF')}
          </PDFDownloadLink>
        )}
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

          {/* Chart Section (Admin Only) */}
          {!isFranchisee && report && report.branches && report.branches.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 mt-8">
                Sales by Branch
              </h3>
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={report.branches.map(b => ({
                      name: b.branch_name.length > 18 ? b.branch_name.substring(0, 18) + '...' : b.branch_name,
                      fullName: b.branch_name,
                      sales: b.total_sales
                    }))}
                    margin={{ top: 10, right: 10, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#6B7280' }} 
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(v) => '₹' + v.toLocaleString('en-IN')} 
                      tick={{ fontSize: 10, fill: '#6B7280' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [formatINRDecimal(value), 'Total Sales']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                      {
                        report.branches.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#2563EB" className="hover:fill-[#60A5FA] cursor-pointer transition-colors" />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Branch Breakdown / Product Sales Breakdown */}
          {isFranchisee ? (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Product Sales Breakdown
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <Table
                  headers={['Product', 'Quantity Sold', 'Revenue']}
                  data={report.branches?.[0]?.product_sales || []}
                  emptyMessage="No product sales recorded for this period."
                  renderRow={(prod, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{prod.product_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{prod.quantity_sold} unit(s)</td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">{formatINRDecimal(prod.revenue)}</td>
                    </tr>
                  )}
                />
              </div>
            </div>
          ) : (
            <ReportBranchTable
              branches={report.branches}
              tableHeaders={tableHeaders}
              showRoyaltyColumns={showRoyaltyColumns}
            />
          )}

          {/* Branch Expense Breakdown */}
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Expense Breakdown
            </h3>
            <div className="space-y-4">
              {report.branches?.map((branch, idx) => (
                <div key={`exp-${branch.branch_id ?? idx}`} className="bg-white border text-sm border-gray-200 rounded-lg overflow-hidden">
                  {!isFranchisee && (
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-gray-700">
                      {branch.branch_name}
                    </div>
                  )}
                  {branch.expenses && branch.expenses.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {branch.expenses.map((exp, i) => (
                        <div key={i} className="flex justify-between px-4 py-2 text-gray-600">
                          <span>{exp.category}</span>
                          <span>{formatINR(exp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">No expenses recorded for this branch.</div>
                  )}
                </div>
              ))}
              {!report.branches?.length && (
                  <div className="px-4 py-3 text-gray-500 text-sm border border-gray-200 rounded-lg">No branch data available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
