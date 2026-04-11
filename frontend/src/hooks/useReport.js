import { useState } from 'react';
import { api } from '../api';

export function useReport(branchId) {
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const generateReport = async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      let url = `/reports/summary?month=${selectedMonth}&year=${selectedYear}`;
      if (branchId) {
        url += `&branch_id=${branchId}`;
      }
      const result = await api.get(url);
      setReport(result);
    } catch (err) {
      setReportError(err.message || 'Failed to generate report.');
    } finally {
      setReportLoading(false);
    }
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
  };
}
