import React from 'react';
import Table from '../ui/Table';

export default function CatalogStockItems({
  stockItems,
  loading,
  onAddStockItem,
  onViewIngredients,
  expandedItemId,
  ingredientsByItem,
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Stock Items</h2>
        <button
          type="button"
          onClick={onAddStockItem}
          className="btn-primary px-4 py-2 text-sm"
        >
          Add Stock Item
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <p className="text-gray-500">Loading stock items…</p>
        </div>
      ) : stockItems.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50">
          <p className="text-gray-500">No stock items yet. Add your first raw material.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <Table headers={['Name', 'Unit', 'Description', 'Used In', '']}>
            {stockItems.map((item) => {
              const usedInProducts = ingredientsByItem[item.stock_item_id] || [];
              const isExpanded = expandedItemId === item.stock_item_id;

              return (
                <React.Fragment key={item.stock_item_id}>
                  <tr className="border-b border-border hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.unit_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {usedInProducts.length} product(s)
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        type="button"
                        onClick={() => onViewIngredients(item.stock_item_id)}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        {isExpanded ? 'Hide' : 'View Products'}
                      </button>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="rounded-md border border-gray-200 bg-white p-4">
                          <h4 className="mb-2 text-sm font-bold text-gray-700">Products using {item.name}</h4>
                          {usedInProducts.length === 0 ? (
                            <p className="text-sm text-gray-500">Not used in any products currently.</p>
                          ) : (
                            <ul className="space-y-2">
                              {usedInProducts.map((prodUsage, idx) => (
                                <li key={idx} className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                  <span>{prodUsage.product_name}</span>
                                  <span>{prodUsage.quantity_required} {item.unit_name} per unit</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </Table>
        </div>
      )}
    </section>
  );
}
