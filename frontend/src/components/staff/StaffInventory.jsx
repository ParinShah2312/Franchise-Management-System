import { useState, useMemo } from 'react';
import { formatNumber } from '../../utils';
import Modal from '../ui/Modal';

const initialDeliveryForm = {
    stock_item_id: '',
    quantity: '',
    note: '',
};

export default function StaffInventory({ inventoryItems, stockItems, recordDelivery, onRefresh, setToast }) {
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [deliverySubmitting, setDeliverySubmitting] = useState(false);
    const [deliveryForm, setDeliveryForm] = useState(initialDeliveryForm);
    const [updatingItemId, setUpdatingItemId] = useState(null);

    const lowStockItems = useMemo(
        () =>
            inventoryItems.filter((item) => {
                const quantity = Number(item.quantity || 0);
                const reorder = Number(item.reorder_level || 0);
                return reorder > 0 && quantity <= reorder;
            }),
        [inventoryItems],
    );

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

        setUpdatingItemId(payload.stock_item_id);
        setDeliverySubmitting(true);

        try {
            await recordDelivery(payload);
            setToast({ message: 'Delivery recorded successfully!', variant: 'success' });
            closeDeliveryModal();
        } catch (err) {
            setToast({ message: err.message || 'Failed to record delivery.', variant: 'error' });
        } finally {
            setDeliverySubmitting(false);
            setUpdatingItemId(null);
        }
    };

    return (
        <div>
            <div className="bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Inventory</h3>
                        {lowStockItems.length > 0 ? (
                            <p className="text-sm text-amber-600 font-medium mt-1">
                                {lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'} at or below reorder level.
                            </p>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                            Refresh
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
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Item
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Unit
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Reorder Level
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {inventoryItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                                        Inventory records will appear here once stocked.
                                    </td>
                                </tr>
                            ) : (
                                inventoryItems.map((item) => {
                                    const quantity = Number(item.quantity || 0);
                                    const reorder = item.reorder_level != null ? Number(item.reorder_level) : null;
                                    const isLow = reorder != null && reorder > 0 && quantity <= reorder;

                                    return (
                                        <tr
                                            key={item.branch_inventory_id || `${item.branch_id}-${item.stock_item_id}`}
                                            className={`${isLow ? 'bg-amber-50' : ''} ${updatingItemId === Number(item.stock_item_id) ? 'animate-pulse bg-gray-100' : 'hover:bg-gray-50/50 transition-colors'}`}
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                {item.stock_item_name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {item.unit_name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {formatNumber(quantity)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 text-right">
                                                {formatNumber(reorder)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={showDeliveryModal}
                onClose={closeDeliveryModal}
                title="Record Stock Delivery"
            >
                        <form className="space-y-4" onSubmit={submitDelivery}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="delivery_stock_item">
                                    Stock Item*
                                </label>
                                <select
                                    id="delivery_stock_item"
                                    required
                                    value={deliveryForm.stock_item_id}
                                    onChange={(event) =>
                                        setDeliveryForm((prev) => ({ ...prev, stock_item_id: event.target.value }))
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Select item</option>
                                    {stockItems.map((item) => (
                                        <option key={item.stock_item_id} value={item.stock_item_id}>
                                            {item.stock_item_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="delivery_quantity">
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="delivery_note">
                                    Note
                                </label>
                                <textarea
                                    id="delivery_note"
                                    rows={3}
                                    value={deliveryForm.note}
                                    onChange={(event) =>
                                        setDeliveryForm((prev) => ({ ...prev, note: event.target.value }))
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
            </Modal>
        </div>
    );
}
