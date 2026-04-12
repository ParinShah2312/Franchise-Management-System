import { useState, useCallback, useEffect } from 'react';
import { api } from '../api';

export function useCatalog() {
  const [stockItems, setStockItems] = useState([]);
  const [stockItemsLoading, setStockItemsLoading] = useState(true);
  const [stockItemsError, setStockItemsError] = useState('');

  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

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

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError('');
    try {
      const data = await api.get('/catalog/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategoriesError(err.message || 'Failed to fetch categories.');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const data = await api.get('/catalog/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    await Promise.all([
      fetchUnits(),
      refreshStockItems(),
      refreshCategories(),
      refreshProducts()
    ]);
  }, [fetchUnits, refreshStockItems, refreshCategories, refreshProducts]);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const createStockItem = async (data) => {
    await api.post('/inventory/stock-items', data);
    await refreshStockItems();
  };

  const createCategory = async (data) => {
    await api.post('/catalog/categories', data);
    await refreshCategories();
  };

  const createProduct = async (data) => {
    await api.post('/catalog/products', data);
    await Promise.all([refreshProducts(), refreshCategories()]);
  };

  const updateProduct = async (productId, data) => {
    await api.put(`/catalog/products/${productId}`, data);
    await Promise.all([refreshProducts(), refreshCategories()]);
  };

  const fetchIngredients = async (productId) => {
    const data = await api.get(`/catalog/products/${productId}/ingredients`);
    return Array.isArray(data) ? data : [];
  };

  const addIngredient = async (productId, data) => {
    await api.post(`/catalog/products/${productId}/ingredients`, data);
    await Promise.all([refreshProducts(), refreshStockItems()]);
  };

  const removeIngredient = async (productId, productIngredientId) => {
    await api.delete(`/catalog/products/${productId}/ingredients/${productIngredientId}`);
    await Promise.all([refreshProducts(), refreshStockItems()]);
  };

  const fetchStockItemProducts = async (stockItemId) => {
    const data = await api.get(`/catalog/stock-items/${stockItemId}/products`);
    return Array.isArray(data) ? data : [];
  };

  return {
    refreshCatalog,
    stockItems,
    stockItemsLoading,
    stockItemsError,
    refreshStockItems,
    units,
    unitsLoading,
    categories,
    categoriesLoading,
    categoriesError,
    refreshCategories,
    products,
    productsLoading,
    refreshProducts,
    createStockItem,
    createCategory,
    createProduct,
    updateProduct,
    fetchIngredients,
    addIngredient,
    removeIngredient,
    fetchStockItemProducts,
  };
}
