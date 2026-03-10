import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useStaff(branchId) {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStaff = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            const targetUrl = `/branch/staff?branch_id=${branchId}`;
            const response = await api.get(targetUrl);
            setStaff(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err.message || 'Failed to load staff.');
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const addStaff = async (staffData) => {
        const payload = { ...staffData, branch_id: branchId };
        await api.post('/auth/register-staff', payload);
        await fetchStaff();
    };

    return { staff, loading, error, addStaff, refreshStaff: fetchStaff };
}
