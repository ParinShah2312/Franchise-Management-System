import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDateTime, formatINRDecimal, getNowString } from '../../utils';
import ConfirmDialog from '../ui/ConfirmDialog';

const EXPENSE_CATEGORIES = [
    'Rent', 'Utilities', 'Salaries', 'Supplies', 'Maintenance',
    'Marketing', 'Insurance', 'Transport', 'Other'
];

const createInitialForm = () => ({
    expense_date: getNowString(),
    category: EXPENSE_CATEGORIES[0],
    description: '',
    amount: '',
});

export default function ManagerExpenses({ expenses, logExpense, deleteExpense, onRefresh, setToast }) {
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(() => createInitialForm());
    const [confirmTarget, setConfirmTarget] = useState(null);

    const closeModal = () => {
        if (submitting) return;
        setShowModal(false);
        setForm(createInitialForm());
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const amount = Number(form.amount);
        if (!amount || amount <= 0) {
            setToast({ message: 'Amount must be greater than zero.', variant: 'error' });
            return;
        }
        setSubmitting(true);
        try {
            await logExpense({
                expense_date: new Date(form.expense_date).toISOString(),
                category: form.category,
                description: form.description || undefined,
                amount,
            });
            setToast({ message: 'Expense logged successfully!', variant: 'success' });
            closeModal();
        } catch (err) {
            setToast({ message: err.message || 'Failed to log expense.', variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmTarget) return;
        try {
            await deleteExpense(confirmTarget.id);
            setToast({ message: 'Expense deleted.', variant: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Failed to delete expense.', variant: 'error' });
        } finally {
            setConfirmTarget(null);
        }
    };

    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return (
        <div>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Expenses</h3>
                        {expenses.length > 0 && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                Total: <span className="font-medium text-gray-700">{formatINRDecimal(totalAmount)}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onRefresh}
                            className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50">
                            Refresh
                        </button>
                        <button type="button" onClick={() => { setForm(createInitialForm()); setShowModal(true); }}
                            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
                            Log Expense
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 text-sm">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No expenses logged yet.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.expense_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatDateTime(expense.expense_date) || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{expense.description || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                                            {formatINRDecimal(expense.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button type="button"
                                                onClick={() => setConfirmTarget({ id: expense.expense_id, category: expense.category })}
                                                className="text-xs font-semibold text-red-600 border border-red-200 rounded-lg px-3 py-1 hover:bg-red-50">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal ? createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-6 max-h-[90dvh] overflow-y-auto mx-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800">Log Expense</h3>
                            <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
                        </div>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expense_date">Date*</label>
                                    <input id="expense_date" type="datetime-local" required
                                        value={form.expense_date}
                                        onChange={(e) => setForm((p) => ({ ...p, expense_date: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expense_category">Category*</label>
                                    <select id="expense_category" required
                                        value={form.category}
                                        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expense_amount">Amount (₹)*</label>
                                <input id="expense_amount" type="number" min="0.01" step="0.01" required
                                    value={form.amount}
                                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expense_desc">Description</label>
                                <textarea id="expense_desc" rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Brief description of this expense" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={closeModal}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60">
                                    {submitting ? 'Saving…' : 'Log Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            , document.body) : null}

            <ConfirmDialog
                open={!!confirmTarget}
                title="Delete Expense"
                message={`Are you sure you want to delete this ${confirmTarget?.category || ''} expense? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
}
