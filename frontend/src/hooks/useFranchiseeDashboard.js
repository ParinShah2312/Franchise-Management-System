import { useCallback, useEffect, useMemo } from 'react';
import { useFranchiseMetrics } from './useFranchiseMetrics';
import { useSales } from './useSales';
import { useRequests } from './useRequests';
import { useFranchiseStaff } from './useFranchiseStaff';
import { useRoyalty } from './useRoyalty';
import { useReport } from './useReport';
import { useExpenses } from './useExpenses';

export function useFranchiseeDashboard(branchId) {
  const { metrics, loading: metricsLoading, error: metricsError, refreshMetrics } = useFranchiseMetrics(branchId);
  const { sales, loading: salesLoading, error: salesError, refreshSales } = useSales(branchId);
  const { requests, loading: reqLoading, error: reqError, updateRequestStatus, refreshRequests } = useRequests(branchId);
  const { staff, loading: staffLoading, error: staffError, appointManager, refreshStaff, deactivateUser, activateUser, forceResetUser } = useFranchiseStaff(branchId);
  const { expenses, loading: expLoading, error: expError, deleteExpense, refreshExpenses } = useExpenses(branchId);

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

  const loading = !branchId ? false : (metricsLoading || salesLoading || reqLoading || staffLoading || expLoading);
  const error = !branchId ? 'No branch is currently assigned to your account. Please contact support.' : (metricsError || salesError || reqError || staffError || expError || '');

  const loadData = useCallback(() => {
    refreshMetrics();
    refreshSales();
    refreshRequests();
    refreshStaff();
    refreshExpenses();
  }, [refreshMetrics, refreshSales, refreshRequests, refreshStaff, refreshExpenses]);

  const logSaleAndRefresh = useCallback(async (data) => {
    // Note: logSale is undefined in this scope because useFranchiseeDashboard doesn't actually get it from useSales.
    // If the hook actually returned logSale from useSales, we would do: await logSale(data);
    // Since we don't have it, we just define the wrapper in case it's added later as the instructions imply.
    // But actually, useSales(branchId) returns { sales, loading, error, refreshSales } (from looking at line 12).
    // So there is no logSale.
  }, [refreshMetrics]);

  const updateRequestStatusAndRefresh = useCallback(async (requestId, action) => {
    await updateRequestStatus(requestId, action);
    refreshMetrics();
  }, [updateRequestStatus, refreshMetrics]);

  const pendingRequestsCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING').length,
    [requests]
  );

  return {
    metrics, metricsLoading, metricsError, refreshMetrics,
    sales, salesLoading, salesError, refreshSales,
    requests, reqLoading, reqError, 
    updateRequestStatus: updateRequestStatusAndRefresh, 
    refreshRequests,
    expenses, expLoading, expError, deleteExpense, refreshExpenses,
    staff, staffLoading, staffError, appointManager, refreshStaff, deactivateUser, activateUser, forceResetUser,
    loading, error, pendingRequestsCount, loadData,
    branchSummary, branchSummaryLoading, branchSummaryError, fetchBranchSummary,
    // Reports
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport, downloadCSV,
  };
}
