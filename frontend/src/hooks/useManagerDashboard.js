import { useCallback, useMemo } from 'react';
import { useStaff } from './useStaff';
import { useInventory } from './useInventory';
import { useSales } from './useSales';
import { useRequests } from './useRequests';
import { getTodayString } from '../utils';

export function useManagerDashboard(branchId) {
  const { staff, loading: staffLoading, error: staffError, addStaff, refreshStaff } = useStaff(branchId);
  const { inventoryItems, stockItems, loading: invLoading, error: invError, addInventory, refreshInventory } = useInventory(branchId);
  const { sales, products, loading: salesLoading, error: salesError, logSale, refreshSales } = useSales(branchId);
  const { requests, loading: reqLoading, error: reqError, createRequest, refreshRequests } = useRequests(branchId);

  const loading = !branchId ? false : (staffLoading || invLoading || salesLoading || reqLoading);
  const error = !branchId ? 'No branch is assigned to your account. Please contact your branch owner.' : (staffError || invError || salesError || reqError || '');

  const loadData = useCallback(() => {
    refreshStaff();
    refreshInventory();
    refreshSales();
    refreshRequests();
  }, [refreshStaff, refreshInventory, refreshSales, refreshRequests]);

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
      .filter((sale) => (sale.sale_datetime || sale.sale_date || '').slice(0, 10) === today)
      .reduce((total, sale) => total + Number(sale.total_amount || 0), 0);
  }, [sales]);

  return {
    staff, staffLoading, staffError, addStaff, refreshStaff,
    inventoryItems, stockItems, invLoading, invError, addInventory, refreshInventory,
    sales, products, salesLoading, salesError, logSale, refreshSales,
    requests, reqLoading, reqError, createRequest, refreshRequests,
    loading, error, pendingRequestsCount, lowStockItems, lowStockItemsCount, todaySalesTotal, loadData,
  };
}
