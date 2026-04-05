import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useExpenses(branchId) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchExpenses = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/expenses?branch_id=${branchId}`);
            setExpenses(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err.message || 'Failed to load expenses.');
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const logExpense = async (data) => {
        await api.post(`/expenses${branchId ? `?branch_id=${branchId}` : ''}`, data);
        await fetchExpenses();
    };

    const deleteExpense = async (expenseId) => {
        await api.delete(`/expenses/${expenseId}`);
        await fetchExpenses();
    };

    return { expenses, loading, error, logExpense, deleteExpense, refreshExpenses: fetchExpenses };
}
