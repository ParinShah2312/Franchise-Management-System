import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useInventory(branchId) {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchInventory = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            const branchQuery = `?branch_id=${branchId}`;
            const [invRes, stockRes] = await Promise.allSettled([
                api.get(`/inventory${branchQuery}`),
                api.get('/inventory/stock-items')
            ]);

            if (invRes.status === 'fulfilled') {
                setInventoryItems(Array.isArray(invRes.value) ? invRes.value : []);
            } else {
                throw new Error(invRes.reason.message || 'Failed to load inventory');
            }

            if (stockRes.status === 'fulfilled') {
                setStockItems(Array.isArray(stockRes.value) ? stockRes.value : []);
            }
        } catch (err) {
            setError(err.message || 'Failed to load inventory data.');
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const addInventory = async (data) => {
        const payload = {
            stock_item_id: data.stock_item_id ? Number(data.stock_item_id) : null,
            quantity: Number(data.quantity || 0),
            reorder_level: Number(data.reorder_level || 0),
        };
        if (!payload.stock_item_id) throw new Error('Select a stock item to add.');

        await api.post(`/inventory${branchId ? `?branch_id=${branchId}` : ''}`, payload);
        await fetchInventory();
    };

    return { inventoryItems, stockItems, loading, error, addInventory, refreshInventory: fetchInventory };
}
