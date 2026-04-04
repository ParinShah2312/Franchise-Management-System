import React, { useState, useCallback } from 'react';
import CatalogStockItems from './CatalogStockItems';
import CatalogProductRecipes from './CatalogProductRecipes';
import CatalogAddStockItemModal from './CatalogAddStockItemModal';
import CatalogCategories from './CatalogCategories';
import CatalogProducts from './CatalogProducts';
import CatalogAddCategoryModal from './CatalogAddCategoryModal';
import CatalogAddProductModal from './CatalogAddProductModal';
import CatalogEditProductModal from './CatalogEditProductModal';
import Toast from '../Toast';

export default function AdminCatalog({
  stockItems,
  stockItemsLoading,
  stockItemsError,
  units,
  unitsLoading,
  products,
  productsLoading,
  createStockItem,
  fetchIngredients,
  addIngredient,
  removeIngredient,
  categories,
  categoriesLoading,
  createCategory,
  createProduct,
  updateProduct,
  refreshProducts,
}) {
  const [showAddStockItemModal, setShowAddStockItemModal] = useState(false);
  const [addStockItemSubmitting, setAddStockItemSubmitting] = useState(false);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCategorySubmitting, setAddCategorySubmitting] = useState(false);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [addProductSubmitting, setAddProductSubmitting] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductSubmitting, setEditProductSubmitting] = useState(false);
  
  const [expandedStockItemId, setExpandedStockItemId] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  
  const [ingredientsByItem, setIngredientsByItem] = useState({});
  const [recipesByProduct, setRecipesByProduct] = useState({});
  
  const [toast, setToast] = useState(null);

  const handleCreateStockItem = async (data) => {
    setAddStockItemSubmitting(true);
    try {
      await createStockItem(data);
      setShowAddStockItemModal(false);
      setToast({ message: 'Stock item created successfully.', variant: 'success' });
    } catch (err) {
      throw err; // Passed up to modal
    } finally {
      setAddStockItemSubmitting(false);
    }
  };

  const handleCreateCategory = async (data) => {
    setAddCategorySubmitting(true);
    try {
      await createCategory(data);
      setShowAddCategoryModal(false);
      setToast({ message: 'Category created successfully.', variant: 'success' });
    } catch (err) {
      throw err;
    } finally {
      setAddCategorySubmitting(false);
    }
  };

  const handleCreateProduct = async (data) => {
    setAddProductSubmitting(true);
    try {
      await createProduct(data);
      setShowAddProductModal(false);
      setToast({ message: 'Product created successfully.', variant: 'success' });
    } catch (err) {
      throw err;
    } finally {
      setAddProductSubmitting(false);
    }
  };

  const handleEditProduct = async (productId, data) => {
    setEditProductSubmitting(true);
    try {
      await updateProduct(productId, data);
      setEditingProduct(null);
      setToast({ message: 'Product updated successfully.', variant: 'success' });
    } catch (err) {
      throw err;
    } finally {
      setEditProductSubmitting(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await updateProduct(product.product_id, { is_active: !product.is_active });
      setToast({ message: `Product ${product.is_active ? 'deactivated' : 'activated'}.`, variant: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to toggle status.', variant: 'error' });
    }
  };

  const handleExpandStockItem = useCallback((stockItemId) => {
    if (expandedStockItemId === stockItemId) {
      setExpandedStockItemId(null);
      return;
    }
    
    // Compute ingredientsByItem locally since it's just a reverse lookup
    // BUT we need all recipes to know which products use this stock item.
    // The prompt says: "When a stock item row is expanded, call fetchIngredients for all products... or simply display a note that this view shows which products use the ingredient (can be a simple lookup from recipesByProduct)."
    // Let's rely on recipesByProduct cache. If a product isn't expanded yet, its recipe might not be loaded. 
    // To be perfectly accurate without massive N+1 queries, we will just use the available data in recipesByProduct.
    // For a robust implementation, the backend would have a reverse lookup endpoint.
    
    setExpandedStockItemId(stockItemId);

    const productsUsingIt = [];
    products.forEach((prod) => {
      const recipe = recipesByProduct[prod.product_id];
      if (recipe) {
        const usage = recipe.find(r => r.stock_item_id === stockItemId);
        if (usage) {
          productsUsingIt.push({
             product_name: prod.name,
             quantity_required: usage.quantity_required
          });
        }
      }
    });

    setIngredientsByItem(prev => ({
       ...prev,
       [stockItemId]: productsUsingIt
    }));
  }, [expandedStockItemId, products, recipesByProduct]);

  const loadRecipe = async (productId) => {
    try {
      const ingredients = await fetchIngredients(productId);
      setRecipesByProduct(prev => ({
        ...prev,
        [productId]: ingredients
      }));
    } catch (err) {
      console.error('Failed to load recipe:', err);
      setToast({ message: 'Failed to load product recipe.', variant: 'error' });
    }
  };

  const handleExpandProduct = useCallback(async (productId) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      return;
    }

    setExpandedProductId(productId);
    
    if (!recipesByProduct[productId]) {
      await loadRecipe(productId);
    }
  }, [expandedProductId, recipesByProduct, fetchIngredients]);

  const handleAddIngredient = async (productId, data) => {
    await addIngredient(productId, data);
    await loadRecipe(productId);
    setToast({ message: 'Ingredient added.', variant: 'success' });
    
    // Invalidate the stock item reverse lookup cache if necessary
    if (expandedStockItemId === data.stock_item_id) {
        handleExpandStockItem(data.stock_item_id);
    }
  };

  const handleRemoveIngredient = async (productId, ingredientId) => {
    try {
      await removeIngredient(productId, ingredientId);
      await loadRecipe(productId);
      setToast({ message: 'Ingredient removed.', variant: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to remove', variant: 'error' });
    }
  };

  if (stockItemsError) {
    return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{stockItemsError}</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Product Categories Section */}
      <CatalogCategories
        categories={categories}
        loading={categoriesLoading}
        onAddCategory={() => setShowAddCategoryModal(true)}
      />

      {/* Products Section */}
      <CatalogProducts
        products={products}
        categories={categories}
        loading={productsLoading}
        onAddProduct={() => setShowAddProductModal(true)}
        onEditProduct={(p) => setEditingProduct(p)}
        onToggleActive={handleToggleActive}
      />

      {/* Product Recipes Section */}
      <CatalogProductRecipes
        products={products}
        loading={productsLoading}
        onViewRecipe={handleExpandProduct}
        expandedProductId={expandedProductId}
        recipesByProduct={recipesByProduct}
        stockItems={stockItems}
        onAddIngredient={handleAddIngredient}
        onRemoveIngredient={handleRemoveIngredient}
      />

      {/* Stock Items Section */}
      <CatalogStockItems
        stockItems={stockItems}
        loading={stockItemsLoading}
        onAddStockItem={() => setShowAddStockItemModal(true)}
        onViewIngredients={handleExpandStockItem}
        expandedItemId={expandedStockItemId}
        ingredientsByItem={ingredientsByItem}
      />

      <CatalogAddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onSubmit={handleCreateCategory}
        submitting={addCategorySubmitting}
      />

      <CatalogAddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onSubmit={handleCreateProduct}
        categories={categories}
        submitting={addProductSubmitting}
      />

      <CatalogEditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSubmit={handleEditProduct}
        product={editingProduct}
        categories={categories}
        submitting={editProductSubmitting}
      />

      <CatalogAddStockItemModal
        isOpen={showAddStockItemModal}
        onClose={() => setShowAddStockItemModal(false)}
        onSubmit={handleCreateStockItem}
        units={units}
        submitting={addStockItemSubmitting}
      />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
