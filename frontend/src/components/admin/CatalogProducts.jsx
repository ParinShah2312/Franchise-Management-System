import React from 'react';
import Table from '../ui/Table';
import { formatINR } from '../../utils/formatters';

export default function CatalogProducts({
  products,
  categories,
  loading,
  onAddProduct,
  onEditProduct,
  onToggleActive,
}) {
  const headers = ['Product', 'Category', 'Price', 'Status', 'Actions'];

  const handleToggle = (product) => {
    const action = product.is_active ? 'inactive' : 'active';
    if (window.confirm(`Set ${product.name} to ${action}?`)) {
      onToggleActive(product);
    }
  };

  return (
    <div className="space-y-4 pt-8 border-t border-gray-200 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Products</h3>
        <button
          onClick={onAddProduct}
          type="button"
          className="btn-primary"
        >
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading products...</div>
      ) : products && products.length > 0 ? (
        <Table headers={headers}>
          {products.map((prod) => (
            <tr key={prod.product_id} className="hover:bg-gray-50/50">
              <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                {prod.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                {prod.category_name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-gray-900">
                {formatINR(prod.base_price)}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <button
                  type="button"
                  onClick={() => handleToggle(prod)}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    prod.is_active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {prod.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <button
                  type="button"
                  onClick={() => onEditProduct(prod)}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
          <p className="text-sm text-gray-500">
            No products yet. Add your first product.
          </p>
        </div>
      )}
    </div>
  );
}
