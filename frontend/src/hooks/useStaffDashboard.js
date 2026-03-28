import { useCallback, useMemo } from 'react';
import { useInventory } from './useInventory';
import { useSales } from './useSales';

export function useStaffDashboard(branchId) {
  const { inventoryItems, stockItems, loading: invLoading, error: invError, recordDelivery, refreshInventory } = useInventory(branchId);
  const { sales, products, loading: salesLoading, error: salesError, logSale, refreshSales } = useSales(branchId);

  const loading = !branchId ? false : (invLoading || salesLoading);
  const error = !branchId ? 'No branch assigned. Please contact your manager.' : (invError || salesError || '');

  const loadData = useCallback(() => {
    refreshInventory();
    refreshSales();
  }, [refreshInventory, refreshSales]);

  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const quantity = Number(item.quantity || 0);
        const reorder = Number(item.reorder_level || 0);
        return reorder > 0 && quantity <= reorder;
      }),
    [inventoryItems]
  );

  return {
    inventoryItems, stockItems, invLoading, invError, recordDelivery, refreshInventory,
    sales, products, salesLoading, salesError, logSale, refreshSales,
    loading, error, lowStockItems, loadData,
  };
}
