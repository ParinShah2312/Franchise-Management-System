import { useState } from 'react';
import { PAYMENT_MODES, getNowString, formatDateTime, formatINRDecimal } from '../../utils';

const createInitialSaleForm = () => ({
    sale_date: getNowString(),
    payment_mode: PAYMENT_MODES[0],
    items: [{ product_id: '', quantity: '' }],
});

export default function ManagerSales({ sales, products, logSale, refreshSales, setToast }) {
    const [showSalesModal, setShowSalesModal] = useState(false);
    const [saleForm, setSaleForm] = useState(() => createInitialSaleForm());
    const [salesSubmitting, setSalesSubmitting] = useState(false);

    const closeSaleModal = () => {
        if (salesSubmitting) return;
        setShowSalesModal(false);
        setSaleForm(createInitialSaleForm());
    };

    const handleAddSaleRow = () => {
        setSaleForm((prev) => ({
            ...prev,
            items: [...prev.items, { product_id: '', quantity: '' }],
        }));
    };

    const handleRemoveSaleRow = (index) => {
        setSaleForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, rowIndex) => rowIndex !== index),
        }));
    };

    const handleSaleItemChange = (index, key, value) => {
        setSaleForm((prev) => ({
            ...prev,
            items: prev.items.map((item, rowIndex) =>
                rowIndex === index ? { ...item, [key]: value } : item,
            ),
        }));
    };

    const submitSale = async (event) => {
        event.preventDefault();

        const sanitizedItems = saleForm.items
            .filter((item) => item.product_id && item.quantity)
            .map((item) => ({
                product_id: Number(item.product_id),
                quantity: Number(item.quantity),
            }));

        if (sanitizedItems.length === 0) {
            setToast({ message: 'Add at least one product to the sale.', variant: 'error' });
            return;
        }

        if (sanitizedItems.some((item) => item.quantity <= 0 || Number.isNaN(item.quantity))) {
            setToast({ message: 'Sale quantities must be positive numbers.', variant: 'error' });
            return;
        }

        const payload = {
            sale_date: new Date(saleForm.sale_date).toISOString(),
            payment_mode: saleForm.payment_mode,
            items: sanitizedItems,
        };

        setSalesSubmitting(true);

        try {
            await logSale(payload);
            setToast({ message: 'Sale logged successfully!', variant: 'success' });
            setShowSalesModal(false);
            setSaleForm(createInitialSaleForm());
        } catch (err) {
            setToast({ message: err.message || 'Failed to log sale.', variant: 'error' });
        } finally {
            setSalesSubmitting(false);
        }
    };

    return (
        <div>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Sales History</h3>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={refreshSales}
                            className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSaleForm(createInitialSaleForm());
                                setShowSalesModal(true);
                            }}
                            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                        >
                            Log Sale
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                                        No sales recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.sale_id || sale.id}>
                                        <td className="px-4 py-3 text-sm text-gray-800">
                                            {formatDateTime(sale.sale_datetime || sale.sale_date) || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                            {formatINRDecimal(sale.total_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{sale.payment_mode || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showSalesModal ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800">Log New Sale</h3>
                            <button
                                type="button"
                                onClick={closeSaleModal}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close sale modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={submitSale}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manager_sale_date">
                                        Sale Date*
                                    </label>
                                    <input
                                        id="manager_sale_date"
                                        type="datetime-local"
                                        required
                                        value={saleForm.sale_date}
                                        onChange={(event) =>
                                            setSaleForm((prev) => ({ ...prev, sale_date: event.target.value }))
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manager_sale_payment_mode">
                                        Payment Mode*
                                    </label>
                                    <select
                                        id="manager_sale_payment_mode"
                                        required
                                        value={saleForm.payment_mode}
                                        onChange={(event) =>
                                            setSaleForm((prev) => ({ ...prev, payment_mode: event.target.value }))
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {PAYMENT_MODES.map((mode) => (
                                            <option key={mode} value={mode}>
                                                {mode}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {saleForm.items.map((item, index) => (
                                    <div
                                        key={`manager-sale-item-${index}`}
                                        className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-4 items-end"
                                    >
                                        <div>
                                            <label
                                                className="block text-sm font-medium text-gray-700 mb-1"
                                                htmlFor={`manager_sale_product_${index}`}
                                            >
                                                Product*
                                            </label>
                                            <select
                                                id={`manager_sale_product_${index}`}
                                                required
                                                value={item.product_id}
                                                onChange={(event) =>
                                                    handleSaleItemChange(index, 'product_id', event.target.value)
                                                }
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select product</option>
                                                {products.map((product) => (
                                                    <option
                                                        key={product.product_id || product.id}
                                                        value={product.product_id || product.id}
                                                    >
                                                        {product.product_name || product.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                className="block text-sm font-medium text-gray-700 mb-1"
                                                htmlFor={`manager_sale_quantity_${index}`}
                                            >
                                                Quantity*
                                            </label>
                                            <input
                                                id={`manager_sale_quantity_${index}`}
                                                type="number"
                                                min={1}
                                                required
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    handleSaleItemChange(index, 'quantity', event.target.value)
                                                }
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="flex md:block justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSaleRow(index)}
                                                disabled={saleForm.items.length === 1}
                                                className="w-full md:w-auto md:px-4 py-3 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddSaleRow}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    + Add Product
                                </button>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeSaleModal}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={salesSubmitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {salesSubmitting ? 'Logging…' : 'Log Sale'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
