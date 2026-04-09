import { useState } from 'react';
import { formatINR, formatINRDecimal } from '../../utils/formatters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const _now = new Date();
const _currentYear = _now.getFullYear();
const YEAR_OPTIONS = [_currentYear, _currentYear - 1, _currentYear - 2];

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminRoyalty({
  config,
  configLoading,
  configured,
  saveConfig,
  saving,
  saveError,
  summary,
  summaryLoading,
  summaryError,
  fetchSummary,
}) {
  const [showEditConfig, setShowEditConfig] = useState(false);
  const [editForm, setEditForm] = useState({ franchisor_cut_pct: '', effective_from: getTodayString() });
  const [formError, setFormError] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(_now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(_currentYear);

  const handleOpenEdit = () => {
    setEditForm({
      franchisor_cut_pct: config ? String(config.franchisor_cut_pct) : '',
      effective_from: getTodayString(),
    });
    setFormError('');
    setShowEditConfig(true);
  };

  const handleCancelEdit = () => {
    setShowEditConfig(false);
    setFormError('');
  };

  const handleSave = async () => {
    const pct = parseFloat(editForm.franchisor_cut_pct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setFormError('Franchisor cut must be a number between 0 and 100.');
      return;
    }
    setFormError('');
    try {
      await saveConfig({
        franchisor_cut_pct: pct,
        effective_from: editForm.effective_from || undefined,
      });
      setShowEditConfig(false);
    } catch {
      // saveError is set by the hook
    }
  };

  const handleLoadSummary = () => {
    fetchSummary(selectedMonth, selectedYear);
  };

  return (
    <div className="space-y-8 pb-10">

      {/* ── Section 1: Royalty Configuration ── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Royalty Configuration</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Define how each sale is split between the franchisor and branch owner.
            </p>
          </div>
        </div>

        <div className="px-6 py-6">
          {configLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="bg-gray-100 rounded-lg p-4 h-20" />
                <div className="bg-gray-100 rounded-lg p-4 h-20" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-48" />
              <div className="h-8 bg-gray-100 rounded w-32" />
            </div>
          ) : !configured ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <p className="text-sm text-amber-700">
                  No royalty configuration set. Sales are being recorded without royalty tracking.
                </p>
              </div>
              {!showEditConfig && (
                <button
                  id="royalty-set-config-btn"
                  type="button"
                  onClick={handleOpenEdit}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Set Configuration
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-blue-500 uppercase tracking-wide font-medium">Franchisor Cut</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{config.franchisor_cut_pct}%</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-emerald-500 uppercase tracking-wide font-medium">Branch Owner Cut</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{config.branch_owner_cut_pct}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Effective from: {config.effective_from} · Config #{config.royalty_config_id}
              </p>
              {!showEditConfig && (
                <button
                  id="royalty-edit-config-btn"
                  type="button"
                  onClick={handleOpenEdit}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Edit Configuration
                </button>
              )}
            </div>
          )}

          {/* Inline edit form */}
          {showEditConfig && (
            <div className="mt-6 border border-gray-200 rounded-lg p-5 bg-gray-50 space-y-4 max-w-md">
              <h3 className="text-sm font-semibold text-gray-700">
                {configured ? 'Update Royalty Split' : 'Set Royalty Split'}
              </h3>

              <div>
                <label htmlFor="royalty-franchisor-pct" className="block text-sm font-medium text-gray-700 mb-1">
                  Franchisor Cut (%)
                </label>
                <input
                  id="royalty-franchisor-pct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editForm.franchisor_cut_pct}
                  onChange={(e) => setEditForm((f) => ({ ...f, franchisor_cut_pct: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 8"
                />
                {editForm.franchisor_cut_pct !== '' && !isNaN(parseFloat(editForm.franchisor_cut_pct)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Branch owner cut: {(100 - parseFloat(editForm.franchisor_cut_pct)).toFixed(2)}%
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Branch owner cut is automatically calculated as 100 − franchisor cut%.
                </p>
              </div>

              <div>
                <label htmlFor="royalty-effective-from" className="block text-sm font-medium text-gray-700 mb-1">
                  Effective From
                </label>
                <input
                  id="royalty-effective-from"
                  type="date"
                  value={editForm.effective_from}
                  onChange={(e) => setEditForm((f) => ({ ...f, effective_from: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(formError || saveError) && (
                <p className="text-sm text-red-600">{formError || saveError}</p>
              )}

              <div className="flex gap-3">
                <button
                  id="royalty-save-btn"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  id="royalty-cancel-btn"
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Royalty Summary Table ── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Royalty Summary</h2>
          <p className="text-sm text-gray-500 mt-0.5">Per-branch royalty breakdown for a selected period.</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Month / Year selectors */}
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label htmlFor="royalty-month-select" className="block text-xs font-medium text-gray-500 mb-1">Month</label>
              <select
                id="royalty-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="royalty-year-select" className="block text-xs font-medium text-gray-500 mb-1">Year</label>
              <select
                id="royalty-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              id="royalty-load-summary-btn"
              type="button"
              onClick={handleLoadSummary}
              disabled={summaryLoading}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {summaryLoading ? 'Loading…' : 'Load Summary'}
            </button>
          </div>

          {summaryError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {summaryError}
            </div>
          )}

          {summaryLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-gray-100 rounded w-full" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded w-full" />
              ))}
            </div>
          )}

          {!summaryLoading && summary && (
            <>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {MONTH_NAMES[summary.month - 1]} {summary.year}
              </p>
              {summary.branches.length === 0 ? (
                <p className="text-sm text-gray-500">No royalty data for this period.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/80">
                      <tr>
                        {['Branch', 'Total Sales', 'Franchisor Earned', 'Branch Owner Earned', 'Cut %'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {summary.branches.map((b) => (
                        <tr key={b.branch_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{b.branch_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatINRDecimal(b.total_sales)}</td>
                          <td className="px-4 py-3 text-sm text-blue-700 font-medium">{formatINRDecimal(b.franchisor_earned)}</td>
                          <td className="px-4 py-3 text-sm text-emerald-700 font-medium">{formatINRDecimal(b.branch_owner_earned)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{b.franchisor_cut_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!summaryLoading && !summary && !summaryError && (
            <p className="text-sm text-gray-400 italic">
              Select a period and click "Load Summary" to view royalty data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
