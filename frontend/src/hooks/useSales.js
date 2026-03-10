import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useSales(branchId) {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSales = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            const branchQuery = `?branch_id=${branchId}`;
            const [salesRes, productsRes] = await Promise.allSettled([
                api.get(`/sales${branchQuery}`),
                api.get(`/sales/products${branchQuery}`)
            ]);

            if (salesRes.status === 'fulfilled') {
                setSales(Array.isArray(salesRes.value) ? salesRes.value : []);
            } else {
                throw new Error(salesRes.reason.message || 'Failed to load sales');
            }

            if (productsRes.status === 'fulfilled') {
                setProducts(Array.isArray(productsRes.value) ? productsRes.value : []);
            }
        } catch (err) {
            setError(err.message || 'Failed to load sales data.');
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const logSale = async (data) => {
        await api.post(`/sales${branchId ? `?branch_id=${branchId}` : ''}`, data);
        await fetchSales();
    };

    return { sales, products, loading, error, logSale, refreshSales: fetchSales };
}
