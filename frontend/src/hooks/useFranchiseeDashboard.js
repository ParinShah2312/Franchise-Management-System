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
  const { sales, loading: salesLoading, error: salesError, logSale, refreshSales } = useSales(branchId);
  const { requests, loading: reqLoading, error: reqError, updateRequestStatus, refreshRequests } = useRequests(branchId);
  const { staff, loading: staffLoading, error: staffError, appointManager, addStaff, refreshStaff, deactivateUser, activateUser, forceResetUser } = useFranchiseStaff(branchId);
  const { expenses, loading: expLoading, error: expError, logExpense, deleteExpense, refreshExpenses } = useExpenses(branchId);

  const {
    branchSummary,
    branchSummaryLoading,
    branchSummaryError,
    fetchBranchSummary,
  } = useRoyalty();

  const {
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport,
  } = useReport(branchId);

  // Fetch branch royalty summary automatically when branchId is ready
  useEffect(() => {
    if (!branchId) return;
    fetchBranchSummary(branchId);
  }, [branchId, fetchBranchSummary]);

  const noBranch = !branchId;
  const loading = !noBranch && (metricsLoading || salesLoading || reqLoading || staffLoading || expLoading);
  const error = noBranch ? 'No branch is currently assigned to your account. Please contact support.' : (metricsError || salesError || reqError || staffError || expError || '');

  const loadData = useCallback(() => {
    refreshMetrics();
    refreshSales();
    refreshRequests();
    refreshStaff();
    refreshExpenses();
  }, [refreshMetrics, refreshSales, refreshRequests, refreshStaff, refreshExpenses]);

  const logSaleAndRefresh = useCallback(async (data) => {
    await logSale(data);
    refreshMetrics();
  }, [logSale, refreshMetrics]);

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
    expenses, expLoading, expError, logExpense, deleteExpense, refreshExpenses,
    staff, staffLoading, staffError, appointManager, addStaff, refreshStaff, deactivateUser, activateUser, forceResetUser,
    loading, error, pendingRequestsCount, loadData, logSale: logSaleAndRefresh,
    branchSummary, branchSummaryLoading, branchSummaryError, fetchBranchSummary,
    // Reports
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport,
  };
}
