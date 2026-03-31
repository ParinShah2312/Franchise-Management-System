import { useCallback, useEffect, useMemo } from 'react';
import { useFranchiseMetrics } from './useFranchiseMetrics';
import { useSales } from './useSales';
import { useRequests } from './useRequests';
import { useFranchiseStaff } from './useFranchiseStaff';
import { useRoyalty } from './useRoyalty';
import { useReport } from './useReport';

export function useFranchiseeDashboard(branchId) {
  const { metrics, loading: metricsLoading, error: metricsError, refreshMetrics } = useFranchiseMetrics(branchId);
  const { sales, loading: salesLoading, error: salesError, refreshSales } = useSales(branchId);
  const { requests, loading: reqLoading, error: reqError, updateRequestStatus, refreshRequests } = useRequests(branchId);
  const { staff, loading: staffLoading, error: staffError, appointManager, refreshStaff, deactivateUser, activateUser } = useFranchiseStaff(branchId);

  const {
    branchSummary,
    branchSummaryLoading,
    branchSummaryError,
    fetchBranchSummary,
  } = useRoyalty();

  const {
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport, downloadCSV,
  } = useReport();

  // Fetch branch royalty summary automatically when branchId is ready
  useEffect(() => {
    if (!branchId) return;
    const now = new Date();
    fetchBranchSummary(branchId, now.getMonth() + 1, now.getFullYear());
  }, [branchId, fetchBranchSummary]);

  const loading = !branchId ? false : (metricsLoading || salesLoading || reqLoading || staffLoading);
  const error = !branchId ? 'No branch is currently assigned to your account. Please contact support.' : (metricsError || salesError || reqError || staffError || '');

  const loadData = useCallback(() => {
    refreshMetrics();
    refreshSales();
    refreshRequests();
    refreshStaff();
  }, [refreshMetrics, refreshSales, refreshRequests, refreshStaff]);

  const pendingRequestsCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING').length,
    [requests]
  );

  return {
    metrics, metricsLoading, metricsError, refreshMetrics,
    sales, salesLoading, salesError, refreshSales,
    requests, reqLoading, reqError, updateRequestStatus, refreshRequests,
    staff, staffLoading, staffError, appointManager, refreshStaff, deactivateUser, activateUser,
    loading, error, pendingRequestsCount, loadData,
    branchSummary, branchSummaryLoading, branchSummaryError, fetchBranchSummary,
    // Reports
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport, downloadCSV,
  };
}
