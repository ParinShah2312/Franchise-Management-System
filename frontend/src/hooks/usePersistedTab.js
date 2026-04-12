import { useState } from 'react';

/**
 * Like useState but persists the value in sessionStorage for the browser session.
 * Tab selection is remembered across re-renders and navigations within the session.
 * @param {string} storageKey - unique key per dashboard
 * @param {string} defaultTab - tab to use when no persisted value exists
 */
export function usePersistedTab(storageKey, defaultTab) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) || defaultTab;
    } catch {
      return defaultTab;
    }
  });

  const setTab = (tab) => {
    try {
      sessionStorage.setItem(storageKey, tab);
    } catch {
      // sessionStorage unavailable (private browsing edge case) — degrade gracefully
    }
    setActiveTab(tab);
  };

  return [activeTab, setTab];
}
