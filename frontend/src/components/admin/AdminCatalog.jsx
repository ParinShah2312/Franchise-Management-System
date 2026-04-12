import React, { useState, useCallback, useEffect } from 'react';
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
  fetchStockItemProducts,
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
  
  // Invalidate caches when underlying catalog data changes to prevent stale UI
  useEffect(() => {
    setIngredientsByItem({});
    setRecipesByProduct({});
  }, [products, stockItems]);
  
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

  const handleExpandStockItem = useCallback(async (stockItemId) => {
    if (expandedStockItemId === stockItemId) {
      setExpandedStockItemId(null);
      return;
    }
    
    setExpandedStockItemId(stockItemId);

    try {
        const productsUsingIt = await fetchStockItemProducts(stockItemId);
        setIngredientsByItem(prev => ({
           ...prev,
           [stockItemId]: productsUsingIt
        }));
    } catch (err) {
        console.error('Failed to load products for this item:', err);
        setToast({ message: 'Failed to load products for this item.', variant: 'error' });
    }
  }, [expandedStockItemId, fetchStockItemProducts]);

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
    
    // Refresh the stock item reverse lookup cache if it's currently expanded
    if (expandedStockItemId === data.stock_item_id) {
      try {
        const productsUsingIt = await fetchStockItemProducts(data.stock_item_id);
        setIngredientsByItem(prev => ({
          ...prev,
          [data.stock_item_id]: productsUsingIt,
        }));
      } catch {
        // Silent — the expanded row will just show stale data
      }
    }
  };

  const handleRemoveIngredient = async (productId, productIngredientId) => {
    try {
      await removeIngredient(productId, productIngredientId);
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
