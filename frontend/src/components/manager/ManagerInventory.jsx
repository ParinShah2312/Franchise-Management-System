import { useState } from 'react';
import { formatNumber } from '../../utils';

const initialInventoryForm = {
    stock_item_id: '',
    quantity: '',
    reorder_level: '',
};

const initialDeliveryForm = {
    stock_item_id: '',
    quantity: '',
    note: '',
};

export default function ManagerInventory({ inventoryItems, stockItems, addInventory, recordDelivery, refreshInventory, setToast }) {
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [inventoryForm, setInventoryForm] = useState(initialInventoryForm);
    const [inventorySubmitting, setInventorySubmitting] = useState(false);

    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [deliverySubmitting, setDeliverySubmitting] = useState(false);
    const [deliveryForm, setDeliveryForm] = useState(initialDeliveryForm);

    const closeDeliveryModal = () => {
        if (deliverySubmitting) return;
        setShowDeliveryModal(false);
        setDeliveryForm(initialDeliveryForm);
    };

    const submitDelivery = async (event) => {
        event.preventDefault();

        const payload = {
            stock_item_id: Number(deliveryForm.stock_item_id),
            quantity: Number(deliveryForm.quantity),
            note: deliveryForm.note || undefined,
        };

        if (!payload.stock_item_id) {
            setToast({ message: 'Select a stock item before submitting.', variant: 'error' });
            return;
        }

        if (!payload.quantity || Number.isNaN(payload.quantity) || payload.quantity <= 0) {
            setToast({ message: 'Quantity must be greater than zero.', variant: 'error' });
            return;
        }

        setDeliverySubmitting(true);

        try {
            await recordDelivery(payload);
            setToast({ message: 'Delivery recorded successfully!', variant: 'success' });
            closeDeliveryModal();
        } catch (err) {
            setToast({ message: err.message || 'Failed to record delivery.', variant: 'error' });
        } finally {
            setDeliverySubmitting(false);
        }
    };

    const handleAddInventory = async (event) => {
        event.preventDefault();
        setInventorySubmitting(true);

        try {
            const payload = {
                stock_item_id: inventoryForm.stock_item_id ? Number(inventoryForm.stock_item_id) : null,
                quantity: Number(inventoryForm.quantity || 0),
                reorder_level: Number(inventoryForm.reorder_level || 0),
            };

            if (!payload.stock_item_id) {
                throw new Error('Select a stock item to add.');
            }

            await addInventory(payload);
            setShowInventoryModal(false);
            setToast({ message: 'Inventory item added successfully!', variant: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Failed to add inventory item.', variant: 'error' });
        } finally {
            setInventorySubmitting(false);
        }
    };

    return (
        <div>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Inventory Items</h3>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={refreshInventory}
                            className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setInventoryForm(initialInventoryForm);
                                setShowInventoryModal(true);
                            }}
                            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                        >
                            Add Item
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDeliveryForm(initialDeliveryForm);
                                setShowDeliveryModal(true);
                            }}
                            className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                        >
                            Record Delivery
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {inventoryItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                                        No inventory records yet.
                                    </td>
                                </tr>
                            ) : (
                                inventoryItems.map((item) => (
                                    <tr key={item.branch_inventory_id || item.id}>
                                        <td className="px-4 py-3 text-sm text-gray-800">{item.stock_item_name || item.item_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{item.unit_name || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                            {formatNumber(item.quantity)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 text-right">
                                            {formatNumber(item.reorder_level)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showInventoryModal ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800">Add Inventory Item</h3>
                            <button
                                type="button"
                                onClick={() => !inventorySubmitting && setShowInventoryModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close inventory modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={handleAddInventory}>
                            <div>
                                <label className="label" htmlFor="manager_inventory_stock_item">
                                    Stock Item*
                                </label>
                                <select
                                    id="manager_inventory_stock_item"
                                    required
                                    value={inventoryForm.stock_item_id}
                                    onChange={(event) =>
                                        setInventoryForm((prev) => ({ ...prev, stock_item_id: event.target.value }))
                                    }
                                    className="input-field"
                                    disabled={inventorySubmitting}
                                >
                                    <option value="">Select item</option>
                                    {stockItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label" htmlFor="manager_inventory_quantity">
                                        Quantity*
                                    </label>
                                    <input
                                        id="manager_inventory_quantity"
                                        type="number"
                                        required
                                        min={0}
                                        value={inventoryForm.quantity}
                                        onChange={(event) =>
                                            setInventoryForm((prev) => ({ ...prev, quantity: event.target.value }))
                                        }
                                        className="input-field"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="label" htmlFor="manager_inventory_reorder">
                                        Reorder Level
                                    </label>
                                    <input
                                        id="manager_inventory_reorder"
                                        type="number"
                                        min={0}
                                        value={inventoryForm.reorder_level}
                                        onChange={(event) =>
                                            setInventoryForm((prev) => ({ ...prev, reorder_level: event.target.value }))
                                        }
                                        className="input-field"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => !inventorySubmitting && setShowInventoryModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inventorySubmitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {inventorySubmitting ? 'Adding…' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {showDeliveryModal ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800">Record Stock Delivery</h3>
                            <button
                                type="button"
                                onClick={closeDeliveryModal}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close delivery modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={submitDelivery}>
                            <div>
                                <label className="label" htmlFor="delivery_stock_item">
                                    Stock Item*
                                </label>
                                <select
                                    id="delivery_stock_item"
                                    required
                                    value={deliveryForm.stock_item_id}
                                    onChange={(event) =>
                                        setDeliveryForm((prev) => ({ ...prev, stock_item_id: event.target.value }))
                                    }
                                    className="input-field"
                                >
                                    <option value="">Select item</option>
                                    {stockItems.map((item) => (
                                        <option key={item.stock_item_id || item.id} value={item.stock_item_id || item.id}>
                                            {item.name || item.stock_item_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label" htmlFor="delivery_quantity">
                                    Quantity Received*
                                </label>
                                <input
                                    id="delivery_quantity"
                                    type="number"
                                    min={1}
                                    required
                                    value={deliveryForm.quantity}
                                    onChange={(event) =>
                                        setDeliveryForm((prev) => ({ ...prev, quantity: event.target.value }))
                                    }
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="label" htmlFor="delivery_note">
                                    Note
                                </label>
                                <textarea
                                    id="delivery_note"
                                    rows={3}
                                    value={deliveryForm.note}
                                    onChange={(event) =>
                                        setDeliveryForm((prev) => ({ ...prev, note: event.target.value }))
                                    }
                                    className="input-field resize-none"
                                    placeholder="Reference or remarks"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeDeliveryModal}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deliverySubmitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow hover:bg-green-700 disabled:opacity-60"
                                >
                                    {deliverySubmitting ? 'Recording…' : 'Record Delivery'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
