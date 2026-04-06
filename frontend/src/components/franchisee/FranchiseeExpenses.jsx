import { formatDateTime, formatINRDecimal } from '../../utils';

export default function FranchiseeExpenses({ expenses, deleteExpense, onRefresh, setToast }) {
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const handleDelete = async (expenseId, category) => {
        if (!window.confirm(`Delete this ${category} expense?`)) return;
        try {
            await deleteExpense(expenseId);
            setToast({ message: 'Expense deleted.', variant: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Failed to delete expense.', variant: 'error' });
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Expenses</h3>
                    {expenses.length > 0 && (
                        <p className="text-sm text-gray-500 mt-0.5">
                            Total logged: <span className="font-medium text-gray-700">{formatINRDecimal(totalAmount)}</span>
                        </p>
                    )}
                </div>
                <button type="button" onClick={onRefresh}
                    className="text-sm px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50">
                    Refresh
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Logged By</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                                    No expenses recorded for this branch.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => (
                                <tr key={expense.expense_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(expense.expense_date) || '—'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{expense.description || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{expense.logged_by_name || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatINRDecimal(expense.amount)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button type="button"
                                            onClick={() => handleDelete(expense.expense_id, expense.category)}
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
    );
}
