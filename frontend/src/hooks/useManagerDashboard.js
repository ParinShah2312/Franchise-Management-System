import { useCallback, useMemo } from 'react';
import { useStaff } from './useStaff';
import { useInventory } from './useInventory';
import { useSales } from './useSales';
import { useRequests } from './useRequests';
import { useExpenses } from './useExpenses';
import { getTodayString } from '../utils';

export function useManagerDashboard(branchId) {
  const { staff, loading: staffLoading, error: staffError, addStaff, refreshStaff, forceResetUser } = useStaff(branchId);
  const { inventoryItems, stockItems, loading: invLoading, error: invError, addInventory, recordDelivery, refreshInventory } = useInventory(branchId);
  const { sales, products, loading: salesLoading, error: salesError, logSale, refreshSales } = useSales(branchId);
  const { requests, loading: reqLoading, error: reqError, createRequest, refreshRequests } = useRequests(branchId);
  const { expenses, loading: expLoading, error: expError, logExpense, deleteExpense, refreshExpenses } = useExpenses(branchId);

  const loading = !branchId || (staffLoading || invLoading || salesLoading || reqLoading || expLoading);
  const error = !branchId ? 'No branch is assigned to your account. Please contact your branch owner.' : (staffError || invError || salesError || reqError || expError || '');

  const loadData = useCallback(() => {
    refreshStaff();
    refreshInventory();
    refreshSales();
    refreshRequests();
    refreshExpenses();
  }, [refreshStaff, refreshInventory, refreshSales, refreshRequests, refreshExpenses]);

  const pendingRequestsCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING').length,
    [requests]
  );

  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const quantity = Number(item.quantity || 0);
        const reorder = Number(item.reorder_level || 0);
        return reorder > 0 && quantity <= reorder;
      }),
    [inventoryItems]
  );

  const lowStockItemsCount = useMemo(
    () => lowStockItems.length,
    [lowStockItems]
  );

  const todaySalesTotal = useMemo(() => {
    const today = getTodayString();
    return sales
      .filter((sale) => sale.sale_datetime && new Date(sale.sale_datetime).toLocaleDateString('en-CA') === today)
      .reduce((total, sale) => total + Number(sale.total_amount || 0), 0);
  }, [sales]);

  return {
    staff, staffLoading, staffError, addStaff, refreshStaff, forceResetUser,
    inventoryItems, stockItems, invLoading, invError, addInventory, recordDelivery, refreshInventory,
    sales, products, salesLoading, salesError, logSale, refreshSales,
    requests, reqLoading, reqError, createRequest, refreshRequests,
    expenses, expLoading, expError, logExpense, deleteExpense, refreshExpenses,
    loading, error, pendingRequestsCount, lowStockItems, lowStockItemsCount, todaySalesTotal, loadData,
  };
}
