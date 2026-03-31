import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useFranchiseStaff(branchId) {
    const [staff, setStaff] = useState({ manager: null, team: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStaff = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/auth/profile');
            const payload = response || {};
            setStaff({
                manager: payload.manager || null,
                team: Array.isArray(payload.staff) ? payload.staff : [],
            });
        } catch (err) {
            setError(err.message || 'Failed to load franchisee staff profile.');
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const appointManager = async (managerData) => {
        const payload = { ...managerData, branch_id: branchId };
        await api.post('/auth/register-manager', payload);
        await fetchStaff();
    };

    const deactivateUser = async (userId) => {
        await api.put(`/users/${userId}/deactivate`);
        await fetchStaff();
    };

    const activateUser = async (userId) => {
        await api.put(`/users/${userId}/activate`);
        await fetchStaff();
    };

    return { staff, loading, error, appointManager, refreshStaff: fetchStaff, deactivateUser, activateUser };
}
