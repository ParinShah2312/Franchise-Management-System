import { useState } from 'react';
import { api } from '../api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function useReport() {
  const now = new Date();
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const generateReport = async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const result = await api.get(
        `/reports/summary?month=${selectedMonth}&year=${selectedYear}`
      );
      setReport(result);
    } catch (err) {
      setReportError(err.message || 'Failed to generate report.');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!report) return;

    const monthName = MONTH_NAMES[selectedMonth - 1];
    const today = new Date().toLocaleDateString('en-IN');

    const hasRoyalty = report.royalty_configured === true;

    const lines = [];

    // Header
    lines.push(`Relay Franchise Report - ${monthName} ${selectedYear}`);
    lines.push(`Generated: ${today}`);
    lines.push('');

    // Summary
    lines.push('Summary');
    lines.push(`Total Sales,₹${report.total_sales}`);
    lines.push(`Total Expenses,₹${report.total_expenses}`);
    lines.push(`Profit/Loss,₹${report.profit_loss}`);
    lines.push('');

    // Branch Breakdown
    lines.push('Branch Breakdown');
    if (hasRoyalty) {
      lines.push('Branch,Total Sales,Franchisor Earned,Branch Owner Earned,Cut %');
      (report.branches || []).forEach((branch) => {
        lines.push(
          `${branch.branch_name},${branch.total_sales},${branch.franchisor_earned},${branch.branch_owner_earned},${branch.franchisor_cut_pct}%`
        );
      });
    } else {
      lines.push('Branch,Total Sales');
      (report.branches || []).forEach((branch) => {
        lines.push(`${branch.branch_name},${branch.total_sales}`);
      });
    }

    const csvContent = lines.join('\n');

    // Encode as UTF-16 LE with BOM — the only encoding Excel reliably opens
    // with full Unicode support (incl. ₹) without needing "Import" wizard.
    const bom = '\uFEFF';
    const str = bom + csvContent;
    const buf = new ArrayBuffer(str.length * 2);
    const view = new Uint16Array(buf);
    for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i);
    }
    const blob = new Blob([buf], { type: 'text/csv;charset=utf-16le;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `relay-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    report,
    reportLoading,
    reportError,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    generateReport,
    downloadCSV,
  };
}
