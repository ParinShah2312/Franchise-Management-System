import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useRequests(branchId) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRequests = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            const branchQuery = `?branch_id=${branchId}`;
            const response = await api.get(`/requests${branchQuery}`);
            setRequests(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err.message || 'Failed to load requests.');
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const createRequest = async (requestData) => {
        await api.post(`/requests${branchId ? `?branch_id=${branchId}` : ''}`, requestData);
        await fetchRequests();
    };

    const updateRequestStatus = async (requestId, action) => {
        await api.put(`/requests/${requestId}/${action}`);
        await fetchRequests();
    };

    return { requests, loading, error, createRequest, updateRequestStatus, refreshRequests: fetchRequests };
}
