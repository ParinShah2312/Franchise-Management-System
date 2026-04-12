import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

export default function CatalogAddStockItemModal({
  isOpen,
  onClose,
  onSubmit,
  units,
  submitting,
}) {
  const [name, setName] = useState('');
  const [unitId, setUnitId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setName('');
      setUnitId('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!unitId) {
      setError('Unit is required');
      return;
    }
    
    setError('');
    try {
      await onSubmit({ stock_item_name: name.trim(), unit_id: Number(unitId), description: description.trim() });
    } catch (err) {
      setError(err.message || 'Failed to create stock item');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Stock Item"
      description="Create a new raw material to use in your product recipes."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="label" htmlFor="stockItemName">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="stockItemName"
            type="text"
            className="input-field"
            placeholder="e.g. Burger Bun"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="stockItemUnit">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            id="stockItemUnit"
            className="input-field"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            disabled={submitting}
            required
          >
            <option value="" disabled>Select a unit</option>
            {units.map((u) => (
              <option key={u.unit_id} value={u.unit_id}>
                {u.unit_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="stockItemDesc">
            Description
          </label>
          <textarea
            id="stockItemDesc"
            className="input-field"
            placeholder="Brief description of this item"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow hover:bg-primary-hover transition-colors disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Stock Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
