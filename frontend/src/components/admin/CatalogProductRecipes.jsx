import React, { useState } from 'react';
import Table from '../ui/Table';
import { formatINR } from '../../utils/formatters';

export default function CatalogProductRecipes({
  products,
  loading,
  onViewRecipe,
  expandedProductId,
  recipesByProduct,
  stockItems,
  onAddIngredient,
  onRemoveIngredient,
}) {
  const [addingIngredientId, setAddingIngredientId] = useState(null);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formError, setFormError] = useState('');

  const handleAddSubmit = async (e, productId) => {
    e.preventDefault();
    if (!selectedStockId || !quantity) {
      setFormError('Item and quantity required.');
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setFormError('Quantity must be positive.');
      return;
    }

    setAddingIngredientId(productId);
    setFormError('');

    try {
      await onAddIngredient(productId, {
        stock_item_id: parseInt(selectedStockId, 10),
        quantity_required: qtyNum,
      });
    } catch (err) {
      setFormError(err.message || 'Failed to add ingredient');
    } finally {
      setSelectedStockId('');
      setQuantity('');
      setAddingIngredientId(null);
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Product Recipes</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <p className="text-gray-500">Loading products…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50">
          <p className="text-gray-500">No products found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <Table headers={['Product', 'Price', 'Ingredients', '']}>
            {products.map((product) => {
              const recipe = recipesByProduct[product.product_id];
              const isLoadingRecipe = typeof recipe === 'undefined';
              const isExpanded = expandedProductId === product.product_id;
              
              const availableStockItems = stockItems.filter(
                (si) => !recipe?.some((ing) => ing.stock_item_id === si.stock_item_id)
              );

              return (
                <React.Fragment key={product.product_id}>
                  <tr className={`border-b border-border hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatINR(product.base_price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.ingredient_count ?? (recipe ? recipe.length : '0')} item(s)
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setFormError('');
                          setSelectedStockId('');
                          setQuantity('');
                          onViewRecipe(product.product_id);
                        }}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        {isExpanded ? 'Hide' : 'View Ingredients'}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan={4} className="px-6 pb-6 pt-2">
                        <div className="rounded-md border border-gray-200 bg-white p-4">
                          <h4 className="mb-3 text-sm font-bold text-gray-700">Ingredients for {product.name}</h4>
                          
                          {isLoadingRecipe ? (
                            <p className="text-sm text-gray-500 mb-4">Loading recipe...</p>
                          ) : recipe.length === 0 ? (
                            <p className="text-sm text-gray-500 mb-4">No ingredients linked yet.</p>
                          ) : (
                            <div className="mb-4 divide-y divide-gray-100">
                              {recipe.map((ingredient) => (
                                <div key={ingredient.ingredient_id} className="flex items-center justify-between py-2 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-800">{ingredient.stock_item_name}</span>
                                    <span className="text-gray-500 ml-2">
                                      ({ingredient.quantity_required} {ingredient.unit_name})
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveIngredient(product.product_id, ingredient.ingredient_id)}
                                    className="text-red-500 hover:text-red-700 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <form onSubmit={(e) => handleAddSubmit(e, product.product_id)} className="mt-4 border-t border-gray-100 pt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Add Ingredient</h5>
                            {formError && (
                              <p className="text-xs text-red-600 mb-2">{formError}</p>
                            )}
                            <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
                              <div className="w-full sm:w-1/2">
                                <label className="sr-only" htmlFor="stockSelect">Stock Item</label>
                                <select
                                  id="stockSelect"
                                  value={selectedStockId}
                                  onChange={(e) => setSelectedStockId(e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                  <option value="">Select a stock item...</option>
                                  {availableStockItems.map((item) => (
                                    <option key={item.stock_item_id} value={item.stock_item_id}>
                                      {item.name} ({item.unit_name})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-full sm:w-1/4">
                                <label className="sr-only" htmlFor="qtyInput">Quantity Required</label>
                                <input
                                  id="qtyInput"
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder="Qty per unit"
                                  value={quantity}
                                  onChange={(e) => setQuantity(e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={addingIngredientId === product.product_id}
                                className="btn-primary w-full sm:w-1/4 py-2 px-3 text-sm whitespace-nowrap disabled:opacity-50"
                              >
                                {addingIngredientId === product.product_id ? 'Adding...' : 'Add'}
                              </button>
                            </div>
                          </form>
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
