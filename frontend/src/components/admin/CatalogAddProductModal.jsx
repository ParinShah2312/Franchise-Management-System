import React, { useState } from 'react';
import Modal from '../ui/Modal';

export default function CatalogAddProductModal({ isOpen, onClose, onSubmit, categories, submitting }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim() || !categoryId || !basePrice) {
      setError('Name, category, and base price are required');
      return;
    }

    try {
      await onSubmit({ 
        name: name.trim(), 
        category_id: parseInt(categoryId, 10), 
        base_price: parseFloat(basePrice),
        description: description.trim() 
      });
      setName('');
      setCategoryId('');
      setBasePrice('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to create product');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Product">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input
            type="text"
            required
            className="input-field mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <select
            required
            className="input-field mt-1"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select a category</option>
            {categories?.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Base Price (₹) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            className="input-field mt-1"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
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
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
