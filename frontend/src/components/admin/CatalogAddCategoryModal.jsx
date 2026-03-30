import React, { useState } from 'react';
import Modal from '../ui/Modal';

export default function CatalogAddCategoryModal({ isOpen, onClose, onSubmit, submitting }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to create category');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="catName" className="block text-sm font-medium text-gray-700">Name *</label>
          <input
            id="catName"
            type="text"
            required
            className="input-field mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="catDesc" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="catDesc"
            rows={3}
            className="input-field mt-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="btn-outline px-4 py-2">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary px-4 py-2">
            {submitting ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
