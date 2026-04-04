import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useCatalog } from './useCatalog';
import { useRoyalty } from './useRoyalty';
import { useReport } from './useReport';

export function useAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [metrics, setMetrics] = useState(null);
  const [network, setNetwork] = useState([]);
  const [applications, setApplications] = useState([]);
  const [menuUploading, setMenuUploading] = useState(false);
  const {
    stockItems, stockItemsLoading, stockItemsError, refreshStockItems,
    units, unitsLoading,
    categories, categoriesLoading, categoriesError, refreshCategories,
    products, productsLoading, refreshProducts,
    createStockItem, createCategory, createProduct, updateProduct,
    fetchIngredients, addIngredient, removeIngredient,
  } = useCatalog();

  const {
    config, configLoading, configured, refreshConfig,
    summary, summaryLoading, summaryError, fetchSummary,
    saveConfig, saving, saveError,
  } = useRoyalty();

  const {
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport, downloadCSV,
  } = useReport();

  const [modalApplication, setModalApplication] = useState(null);
  const [actionState, setActionState] = useState({ id: null, type: null });
  const fileInputRef = useRef(null);

  const [rejectionModal, setRejectionModal] = useState({ open: false, applicationId: null });
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);
  const [rejectionError, setRejectionError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsResponse, networkResponse, applicationsResponse] = await Promise.all([
        api.get('/franchisee/franchisor/metrics'),
        api.get('/franchises/network'),
        api.get('/franchises/applications'),
      ]);

      setMetrics(metricsResponse);
      setNetwork(Array.isArray(networkResponse) ? networkResponse : []);
      setApplications(Array.isArray(applicationsResponse) ? applicationsResponse : []);

      await Promise.all([refreshStockItems(), refreshCategories(), refreshProducts()]);
    } catch (err) {
      const message = err.message || 'Unable to load dashboard data.';
      setError(message);
      setToast({ message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [refreshStockItems, refreshCategories, refreshProducts]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const beginAction = (id, type) => setActionState({ id, type });
  const endAction = () => setActionState({ id: null, type: null });

  const handleApprove = async (applicationId) => {
    beginAction(applicationId, 'approve');
    try {
      await api.put(`/franchises/applications/${applicationId}/approve`);
      await fetchDashboard();
      setModalApplication((prev) =>
        prev && prev.application_id === applicationId ? null : prev
      );
    } catch (err) {
      setError(err.message || 'Failed to approve application.');
    } finally {
      endAction();
    }
  };

  const openRejectionModal = (applicationId) => {
    setRejectionModal({ open: true, applicationId });
    setRejectionNote('');
    setRejectionError('');
  };

  const closeRejectionModal = () => {
    setRejectionModal({ open: false, applicationId: null });
    setRejectionNote('');
    setRejectionError('');
  };

  const submitRejection = async () => {
    const trimmed = rejectionNote.trim();
    if (trimmed.length < 10) {
      setRejectionError('Rejection reason must be at least 10 characters.');
      return;
    }
    
    setRejectionError('');
    setRejectionSubmitting(true);
    try {
      await api.put(
        `/franchises/applications/${rejectionModal.applicationId}/reject`,
        { notes: trimmed }
      );
      await fetchDashboard();
      setRejectionModal({ open: false, applicationId: null });
      setRejectionNote('');
      setModalApplication(null); // close the ApplicationModal too if still open
      setToast({ message: 'Application rejected successfully.', variant: 'success' });
    } catch (err) {
      setRejectionError(err.message || 'Failed to reject application.');
    } finally {
      setRejectionSubmitting(false);
    }
  };

  const flattenedBranches = useMemo(() => {
    return network.flatMap((franchise) =>
      (franchise.branches || []).map((branch) => ({
        franchiseId: franchise.franchise_id,
        franchiseName: franchise.franchise_name,
        branchId: branch.branch_id,
        branchName: branch.name,
        location: branch.location,
        ownerName: branch.owner_name,
        managerName: branch.manager_name,
        status: branch.status,
      }))
    );
  }, [network]);

  const primaryFranchise = useMemo(() => {
    if (!Array.isArray(network) || network.length === 0) return null;
    return network[0];
  }, [network]);

  const handleMenuButtonClick = () => {
    if (!primaryFranchise) {
      setToast({ message: 'No franchise found to upload a menu for.', variant: 'error' });
      return;
    }
    fileInputRef.current?.click();
  };

  const uploadMenuFile = async (file) => {
    if (!file || !primaryFranchise) return;

    const formData = new FormData();
    formData.append('menu_file', file);

    setMenuUploading(true);

    try {
      await api.post(`/franchises/${primaryFranchise.franchise_id}/menu`, formData);
      setToast({ message: 'Menu uploaded successfully!', variant: 'success' });
      await fetchDashboard();
    } catch (err) {
      setToast({ message: err.message || 'Failed to upload menu.', variant: 'error' });
    } finally {
      setMenuUploading(false);
    }
  };

  const handleMenuFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMenuFile(file);
    }
    event.target.value = '';
  };

  const toggleBranchStatus = async (branchId, newStatus) => {
    await api.put(`/franchises/branches/${branchId}/status`, { status: newStatus });
    await fetchDashboard();
  };

  const openApplication = (application) => {
    setModalApplication(application);
  };

  const closeModal = () => setModalApplication(null);

  return {
    metrics, network, applications, loading, error, toast,
    products, productsLoading,
    categories, categoriesLoading, categoriesError, refreshCategories, refreshProducts,
    createCategory, createProduct, updateProduct,
    stockItems, stockItemsLoading, stockItemsError, refreshStockItems,
    units, unitsLoading,
    createStockItem, fetchIngredients, addIngredient, removeIngredient,
    activeTab, setActiveTab,
    modalApplication, setModalApplication,
    actionState,
    menuUploading,
    rejectionModal, rejectionNote, setRejectionNote,
    rejectionSubmitting, rejectionError,
    flattenedBranches,
    primaryFranchise,
    fetchDashboard,
    handleApprove,
    openRejectionModal,
    closeRejectionModal,
    submitRejection,
    openApplication,
    closeModal,
    handleMenuButtonClick,
    uploadMenuFile,
    handleMenuFileChange,
    toggleBranchStatus,
    setToast,
    fileInputRef,
    // Royalty
    config, configLoading, configured, refreshConfig,
    summary, summaryLoading, summaryError, fetchSummary,
    saveConfig, saving, saveError,
    // Reports
    report, reportLoading, reportError,
    selectedMonth, selectedYear, setSelectedMonth, setSelectedYear,
    generateReport, downloadCSV,
  };
}
