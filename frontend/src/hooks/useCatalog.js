import { useState, useCallback, useEffect } from 'react';
import { api } from '../api';

export function useCatalog() {
  const [stockItems, setStockItems] = useState([]);
  const [stockItemsLoading, setStockItemsLoading] = useState(true);
  const [stockItemsError, setStockItemsError] = useState('');

  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(true);

  const fetchUnits = useCallback(async () => {
    setUnitsLoading(true);
    try {
      const data = await api.get('/inventory/units');
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch units:', err);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  const refreshStockItems = useCallback(async () => {
    setStockItemsLoading(true);
    setStockItemsError('');
    try {
      const data = await api.get('/inventory/stock-items/all');
      setStockItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setStockItemsError(err.message || 'Failed to fetch stock items.');
    } finally {
      setStockItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
    refreshStockItems();
  }, [fetchUnits, refreshStockItems]);

  const createStockItem = async (data) => {
    await api.post('/inventory/stock-items', data);
    await refreshStockItems();
  };

  const fetchIngredients = async (productId) => {
    const data = await api.get(`/catalog/products/${productId}/ingredients`);
    return Array.isArray(data) ? data : [];
  };

  const addIngredient = async (productId, data) => {
    await api.post(`/catalog/products/${productId}/ingredients`, data);
  };

  const removeIngredient = async (productId, ingredientId) => {
    await api.delete(`/catalog/products/${productId}/ingredients/${ingredientId}`);
  };

  return {
    stockItems,
    stockItemsLoading,
    stockItemsError,
    refreshStockItems,
    units,
    unitsLoading,
    createStockItem,
    fetchIngredients,
    addIngredient,
    removeIngredient,
  };
}
