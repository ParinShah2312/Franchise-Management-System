import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

export function useRoyalty() {
  // --- Config state ---
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  // --- Franchisor summary state ---
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // --- Branch owner summary state ---
  const [branchSummary, setBranchSummary] = useState(null);
  const [branchSummaryLoading, setBranchSummaryLoading] = useState(false);
  const [branchSummaryError, setBranchSummaryError] = useState('');

  // --- Config save state ---
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [configError, setConfigError] = useState('');

  // Fetch config on mount
  const refreshConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError('');
    try {
      const data = await api.get('/royalty/config');
      setConfigured(data.configured ?? false);
      setConfig(data.config ?? null);
    } catch (err) {
      if (!err.message?.toLowerCase().includes('permission')) {
        const errorMsg = err.message || 'Failed to load royalty configuration.';
        setConfigError(errorMsg);
      }
      setConfigured(false);
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Fetch franchisor royalty summary on demand
  const fetchSummary = useCallback(async (month, year) => {
    const now = new Date();
    const finalMonth = month || now.getMonth() + 1;
    const finalYear = year || now.getFullYear();
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const data = await api.get(`/royalty/summary?month=${finalMonth}&year=${finalYear}`);
      setSummary(data);
    } catch (err) {
      setSummaryError(err.message || 'Failed to load royalty summary.');
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch branch royalty summary on demand
  const fetchBranchSummary = useCallback(async (branchId, month, year) => {
    if (!branchId) return;
    const now = new Date();
    const finalMonth = month || now.getMonth() + 1;
    const finalYear = year || now.getFullYear();
    setBranchSummaryLoading(true);
    setBranchSummaryError('');
    try {
      const data = await api.get(
        `/royalty/branch-summary?branch_id=${branchId}&month=${finalMonth}&year=${finalYear}`
      );
      setBranchSummary(data);
    } catch (err) {
      setBranchSummaryError(err.message || 'Failed to load royalty data.');
      setBranchSummary(null);
    } finally {
      setBranchSummaryLoading(false);
    }
  }, []);

  // Save royalty config
  const saveConfig = useCallback(async ({ franchisor_cut_pct, effective_from }) => {
    setSaving(true);
    setSaveError('');
    try {
      await api.post('/royalty/config', { franchisor_cut_pct, effective_from });
      await refreshConfig();
    } catch (err) {
      setSaveError(err.message || 'Failed to save configuration.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refreshConfig]);

  return {
    // Config
    config,
    configLoading,
    configError,
    configured,
    refreshConfig,

    // Franchisor summary
    summary,
    summaryLoading,
    summaryError,
    fetchSummary,

    // Branch owner summary
    branchSummary,
    branchSummaryLoading,
    branchSummaryError,
    fetchBranchSummary,

    // Config save
    saveConfig,
    saving,
    saveError,
  };
}
