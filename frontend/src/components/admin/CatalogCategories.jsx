import React from 'react';
import Table from '../ui/Table';

export default function CatalogCategories({ categories, loading, onAddCategory }) {
  const headers = ['Category', 'Description', 'Active Products'];

  return (
    <div className="space-y-4 pt-8 border-t border-gray-200 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Product Categories</h2>
        <button
          onClick={onAddCategory}
          type="button"
          className="btn-primary px-4 py-2 text-sm"
        >
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading categories...</div>
      ) : categories && categories.length > 0 ? (
        <Table headers={headers}>
          {categories.map((cat) => (
            <tr key={cat.category_id} className="hover:bg-gray-50/50">
              <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                {cat.name}
              </td>
              <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                {cat.description || '—'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                {cat.product_count}
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
          <p className="text-sm text-gray-500">
            No categories yet. Add your first product category.
          </p>
        </div>
      )}
    </div>
  );
}
