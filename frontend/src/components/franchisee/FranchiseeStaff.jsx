import { useState } from 'react';
import { createPortal } from 'react-dom';
import { sanitizePhone, formatRole } from '../../utils';

export default function FranchiseeStaff({ staff, appointManager, setToast, onDeactivate, onActivate, onForceReset }) {
    const [showManagerModal, setShowManagerModal] = useState(false);
    const [managerSubmitting, setManagerSubmitting] = useState(false);
    const [managerForm, setManagerForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    });

    return (
        <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">My Staff</h3>
                        <p className="text-sm text-gray-500">Manage your branch manager and support staff.</p>
                    </div>
                    {!staff.manager ? (
                        <button
                            type="button"
                            onClick={() => {
                                setManagerForm({ name: '', email: '', password: '', phone: '' });
                                setShowManagerModal(true);
                            }}
                            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                        >
                            Appoint Manager
                        </button>
                    ) : null}
                </div>

                <div className="border border-gray-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700">Branch Manager</h4>
                    </div>
                    <div className="px-4 py-4">
                        {staff.manager ? (
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{staff.manager.name}</p>
                                    <p className="text-sm text-gray-600">{staff.manager.email}</p>
                                    <p className="text-sm text-gray-500">{staff.manager.phone || '—'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const confirmed = window.confirm(
                                            `Force ${staff.manager.name} to reset their password on next login?`
                                        );
                                        if (!confirmed) return;
                                        try {
                                            await onForceReset(staff.manager.user_id || staff.manager.id);
                                            setToast({ message: `${staff.manager.name} will be prompted to reset their password on next login.`, variant: 'success' });
                                        } catch (err) {
                                            setToast({ message: err.message || 'Failed to set reset flag.', variant: 'error' });
                                        }
                                    }}
                                    className="px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50"
                                >
                                    Reset Password
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No manager assigned yet. Appoint one to oversee operations.</p>
                        )}
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Support Staff</h4>
                        <span className="text-xs text-gray-500">{staff.team.length} staff members</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {staff.team.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-sm text-gray-500 text-center">
                                            No staff members linked to this branch.
                                        </td>
                                    </tr>
                                ) : (
                                    staff.team.map((member) => (
                                        <tr
                                            key={member.user_id}
                                            className={member.is_active === false ? 'bg-gray-50' : ''}
                                        >
                                            <td className={`px-4 py-3 text-sm font-medium text-gray-800${member.is_active === false ? ' opacity-50' : ''}`}>{member.name}</td>
                                            <td className={`px-4 py-3 text-sm text-gray-600${member.is_active === false ? ' opacity-50' : ''}`}>{member.email}</td>
                                            <td className={`px-4 py-3 text-sm${member.is_active === false ? ' opacity-50' : ''}`}>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    member.is_active !== false
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {member.is_active !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {member.role !== 'BRANCH_OWNER' ? (
                                                    <div className="flex justify-end items-center">
                                                    {member.is_active !== false ? (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const confirmed = window.confirm(
                                                                    `Deactivate ${member.name}? They will no longer be able to log in.`
                                                                );
                                                                if (!confirmed) return;
                                                                try {
                                                                    await onDeactivate(member.user_id);
                                                                    setToast({ message: `${member.name} has been deactivated.`, variant: 'success' });
                                                                } catch (err) {
                                                                    setToast({ message: err.message || 'Failed to deactivate user.', variant: 'error' });
                                                                }
                                                            }}
                                                            className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const confirmed = window.confirm(
                                                                    `Reactivate ${member.name}? They will be able to log in again.`
                                                                );
                                                                if (!confirmed) return;
                                                                try {
                                                                    await onActivate(member.user_id);
                                                                    setToast({ message: `${member.name} has been reactivated.`, variant: 'success' });
                                                                } catch (err) {
                                                                    setToast({ message: err.message || 'Failed to reactivate user.', variant: 'error' });
                                                                }
                                                            }}
                                                            className="px-3 py-1 text-xs font-semibold text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                                                        >
                                                            Reactivate
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            const confirmed = window.confirm(
                                                                `Force ${member.name} to reset their password on next login?`
                                                            );
                                                            if (!confirmed) return;
                                                            try {
                                                                await onForceReset(member.user_id);
                                                                setToast({ message: `${member.name} will be prompted to reset their password on next login.`, variant: 'success' });
                                                            } catch (err) {
                                                                setToast({ message: err.message || 'Failed to set reset flag.', variant: 'error' });
                                                            }
                                                        }}
                                                        className="px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 ml-2"
                                                    >
                                                        Reset Password
                                                    </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showManagerModal ? createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-6 transform transition-all max-h-[90dvh] overflow-y-auto mx-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Appoint Branch Manager</h3>
                            <button
                                type="button"
                                onClick={() => !managerSubmitting && setShowManagerModal(false)}
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                                aria-label="Close manager modal"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <form
                            className="space-y-4"
                            onSubmit={async (event) => {
                                event.preventDefault();
                                setManagerSubmitting(true);
                                try {
                                    await appointManager({
                                        name: managerForm.name.trim(),
                                        email: managerForm.email.trim(),
                                        password: managerForm.password,
                                        phone: managerForm.phone.trim(),
                                    });
                                    setShowManagerModal(false);
                                    setToast({ message: 'Manager appointed successfully!', variant: 'success' });
                                } catch (err) {
                                    setToast({ message: err.message || 'Failed to appoint manager.', variant: 'error' });
                                } finally {
                                    setManagerSubmitting(false);
                                }
                            }}
                        >
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_name">
                                    Full Name*
                                </label>
                                <input
                                    id="manager_name"
                                    type="text"
                                    required
                                    value={managerForm.name}
                                    onChange={(event) => setManagerForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                                    placeholder="Riya Sharma"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_email">
                                    Email*
                                </label>
                                <input
                                    id="manager_email"
                                    type="email"
                                    required
                                    value={managerForm.email}
                                    onChange={(event) => setManagerForm((prev) => ({ ...prev, email: event.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                                    placeholder="manager@relay.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_password">
                                    Temporary Password*
                                </label>
                                <input
                                    id="manager_password"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={managerForm.password}
                                    onChange={(event) => setManagerForm((prev) => ({ ...prev, password: event.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                                    placeholder="min 8 characters"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_phone">
                                    Phone Number*
                                </label>
                                <input
                                    id="manager_phone"
                                    type="tel"
                                    required
                                    value={managerForm.phone}
                                    onChange={(event) => setManagerForm((prev) => ({ ...prev, phone: sanitizePhone(event.target.value) }))}
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                                    placeholder="1234567890"
                                    maxLength={10}
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => !managerSubmitting && setShowManagerModal(false)}
                                    className="px-4 py-2 bg-white text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={managerSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors duration-200"
                                >
                                    {managerSubmitting ? 'Saving…' : 'Appoint Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            , document.body) : null}
        </div>
    );
}
