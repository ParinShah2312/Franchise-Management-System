import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useFranchiseMetrics(branchId) {
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMetrics = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            const metricsUrl = `/dashboard/branch/metrics${branchId ? `?branch_id=${branchId}` : ''}`;
            const response = await api.get(metricsUrl);
            setMetrics(response || {});
        } catch (err) {
            setError(err.message || 'Failed to load branch metrics.');
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return { metrics, loading, error, refreshMetrics: fetchMetrics };
}
