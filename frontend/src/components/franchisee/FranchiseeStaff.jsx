import { useState } from 'react';

import { isValidPhone, sanitizePhone, formatRole } from '../../utils';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';

export default function FranchiseeStaff({ staff, appointManager, addStaff, setToast, onDeactivate, onActivate, onForceReset }) {
    const [showManagerModal, setShowManagerModal] = useState(false);
    const [managerSubmitting, setManagerSubmitting] = useState(false);
    const [managerForm, setManagerForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    });
    const [confirmAction, setConfirmAction] = useState(null);

    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [staffErrors, setStaffErrors] = useState({});
    const [staffSubmitting, setStaffSubmitting] = useState(false);

    const validateStaffForm = () => {
        const errors = {};
        if (!isValidPhone(staffForm.phone)) {
            errors.phone = 'Phone number must be exactly 10 digits.';
        }
        return errors;
    };

    const handleAddStaff = async (event) => {
        event.preventDefault();
        const validationErrors = validateStaffForm();
        if (Object.keys(validationErrors).length > 0) {
            setStaffErrors(validationErrors);
            return;
        }

        setStaffErrors({});
        setStaffSubmitting(true);

        try {
            await addStaff(staffForm);
            setShowAddStaffModal(false);
            setToast({ message: 'Staff member added successfully!', variant: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Failed to add staff member.', variant: 'error' });
        } finally {
            setStaffSubmitting(false);
        }
    };

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
                                    onClick={() => setConfirmAction({
                                        title: 'Reset Password',
                                        message: `Force ${staff.manager.name} to reset their password on next login?`,
                                        label: 'Reset Password',
                                        variant: 'warning',
                                        handler: async () => {
                                            await onForceReset(staff.manager.user_id);
                                            setToast({ message: `${staff.manager.name} will be prompted to reset their password on next login.`, variant: 'success' });
                                        },
                                    })}
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
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{staff.team.length} staff members</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setStaffForm({ name: '', email: '', phone: '', password: '' });
                                    setStaffErrors({});
                                    setShowAddStaffModal(true);
                                }}
                                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                            >
                                Add Staff
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {staff.team.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-sm text-gray-500 text-center">
                                            No staff members linked to this branch.
                                        </td>
                                    </tr>
                                ) : (
                                    staff.team.map((member) => (
                                        <tr
                                            key={member.user_id}
                                            className={`hover:bg-gray-50/50 transition-colors ${member.is_active === false ? 'bg-gray-50' : ''}`}
                                        >
                                            <td className={`px-6 py-4 text-sm font-medium text-gray-800${member.is_active === false ? ' opacity-50' : ''}`}>{member.name}</td>
                                            <td className={`px-6 py-4 text-sm text-gray-600${member.is_active === false ? ' opacity-50' : ''}`}>{member.email}</td>
                                            <td className={`px-6 py-4 text-sm${member.is_active === false ? ' opacity-50' : ''}`}>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    member.is_active !== false
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {member.is_active !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {member.role !== 'BRANCH_OWNER' ? (
                                                    <div className="flex justify-end items-center">
                                                    {member.is_active !== false ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmAction({
                                                                title: 'Deactivate Staff',
                                                                message: `Deactivate ${member.name}? They will no longer be able to log in.`,
                                                                label: 'Deactivate',
                                                                variant: 'danger',
                                                                handler: async () => {
                                                                    await onDeactivate(member.user_id);
                                                                    setToast({ message: `${member.name} has been deactivated.`, variant: 'success' });
                                                                },
                                                            })}
                                                            className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmAction({
                                                                title: 'Reactivate Staff',
                                                                message: `Reactivate ${member.name}? They will be able to log in again.`,
                                                                label: 'Reactivate',
                                                                variant: 'primary',
                                                                handler: async () => {
                                                                    await onActivate(member.user_id);
                                                                    setToast({ message: `${member.name} has been reactivated.`, variant: 'success' });
                                                                },
                                                            })}
                                                            className="px-3 py-1 text-xs font-semibold text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                                                        >
                                                            Reactivate
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmAction({
                                                            title: 'Reset Password',
                                                            message: `Force ${member.name} to reset their password on next login?`,
                                                            label: 'Reset Password',
                                                            variant: 'warning',
                                                            handler: async () => {
                                                                await onForceReset(member.user_id);
                                                                setToast({ message: `${member.name} will be prompted to reset their password on next login.`, variant: 'success' });
                                                            },
                                                        })}
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

            <Modal
                isOpen={showManagerModal}
                onClose={() => { if (!managerSubmitting) setShowManagerModal(false); }}
                title="Appoint Branch Manager"
            >
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
            </Modal>

            <Modal
                isOpen={showAddStaffModal}
                onClose={() => { if (!staffSubmitting) setShowAddStaffModal(false); }}
                title="Add Staff Member"
            >
                        <form className="space-y-4" onSubmit={handleAddStaff}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="franchisee_staff_name">
                                    Full Name*
                                </label>
                                <input
                                    id="franchisee_staff_name"
                                    type="text"
                                    required
                                    value={staffForm.name}
                                    onChange={(event) => setStaffForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="franchisee_staff_email">
                                    Email Address*
                                </label>
                                <input
                                    id="franchisee_staff_email"
                                    type="email"
                                    required
                                    value={staffForm.email}
                                    onChange={(event) => setStaffForm((prev) => ({ ...prev, email: event.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="jane.doe@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="franchisee_staff_phone">
                                    Phone Number*
                                </label>
                                <input
                                    id="franchisee_staff_phone"
                                    type="tel"
                                    required
                                    value={staffForm.phone}
                                    onChange={(event) => {
                                        setStaffForm((prev) => ({ ...prev, phone: sanitizePhone(event.target.value) }));
                                        if (staffErrors.phone) {
                                            setStaffErrors((prev) => ({ ...prev, phone: '' }));
                                        }
                                    }}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 ${
                                        staffErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    placeholder="10-digit mobile number"
                                    maxLength={10}
                                />
                                {staffErrors.phone && <p className="text-red-500 text-sm mt-1">{staffErrors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="franchisee_staff_password">
                                    Temporary Password*
                                </label>
                                <input
                                    id="franchisee_staff_password"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={staffForm.password}
                                    onChange={(event) => setStaffForm((prev) => ({ ...prev, password: event.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Minimum 8 characters"
                                />
                                <p className="text-xs text-gray-500 mt-1">Staff will be asked to change this upon first login.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => !staffSubmitting && setShowAddStaffModal(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={staffSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                >
                                    {staffSubmitting ? 'Adding...' : 'Add Staff'}
                                </button>
                            </div>
                        </form>
            </Modal>

            <ConfirmDialog
                open={!!confirmAction}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
                confirmLabel={confirmAction?.label || 'Confirm'}
                variant={confirmAction?.variant || 'danger'}
                onConfirm={async () => {
                    try {
                        await confirmAction?.handler?.();
                    } catch (err) {
                        setToast({ message: err.message || 'Action failed.', variant: 'error' });
                    } finally {
                        setConfirmAction(null);
                    }
                }}
                onCancel={() => setConfirmAction(null)}
            />
        </div>
    );
}
