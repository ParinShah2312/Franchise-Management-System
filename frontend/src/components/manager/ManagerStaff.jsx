import { useState } from 'react';

const initialStaffForm = {
    name: '',
    email: '',
    phone: '',
    password: '',
};

export default function ManagerStaff({ staff, addStaff, setToast }) {
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState(initialStaffForm);
    const [staffErrors, setStaffErrors] = useState({});
    const [staffSubmitting, setStaffSubmitting] = useState(false);

    const validateStaffForm = () => {
        const errors = {};
        if (staffForm.phone.length !== 10) {
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
            <div className="bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">My Staff</h3>
                        <p className="text-sm text-gray-500">Team members assigned to your branch.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setStaffForm(initialStaffForm);
                            setStaffErrors({});
                            setShowAddStaffModal(true);
                        }}
                        className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                    >
                        Add Staff
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {staff.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                                        No staff members added yet.
                                    </td>
                                </tr>
                            ) : (
                                staff.map((member) => (
                                    <tr key={member.id}>
                                        <td className="px-4 py-3 text-sm text-gray-800">{member.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{member.phone || '—'}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{member.role || 'STAFF'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddStaffModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800">Add Staff Member</h3>
                            <button
                                type="button"
                                onClick={() => !staffSubmitting && setShowAddStaffModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close staff modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={handleAddStaff}>
                            <div>
                                <label className="label" htmlFor="manager_staff_name">
                                    Full Name*
                                </label>
                                <input
                                    id="manager_staff_name"
                                    type="text"
                                    required
                                    value={staffForm.name}
                                    onChange={(event) => setStaffForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="input-field"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div>
                                <label className="label" htmlFor="manager_staff_email">
                                    Email*
                                </label>
                                <input
                                    id="manager_staff_email"
                                    type="email"
                                    required
                                    value={staffForm.email}
                                    onChange={(event) => setStaffForm((prev) => ({ ...prev, email: event.target.value }))}
                                    className="input-field"
                                    placeholder="jane@example.com"
                                />
                            </div>

                            <div>
                                <label className="label" htmlFor="manager_staff_phone">
                                    Phone*
                                </label>
                                <input
                                    id="manager_staff_phone"
                                    type="tel"
                                    required
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={staffForm.phone}
                                    onChange={(event) => {
                                        const sanitized = event.target.value.replace(/\D/g, '').slice(0, 10);
                                        setStaffForm((prev) => ({ ...prev, phone: sanitized }));
                                    }}
                                    className={`input-field ${staffErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                                    placeholder="9876543210"
                                />
                                {staffErrors.phone ? (
                                    <p className="mt-1 text-sm text-red-600">{staffErrors.phone}</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="label" htmlFor="manager_staff_password">
                                    Temporary Password*
                                </label>
                                <input
                                    id="manager_staff_password"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={staffForm.password}
                                    onChange={(event) => setStaffForm((prev) => ({ ...prev, password: event.target.value }))}
                                    className="input-field"
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!staffSubmitting) {
                                            setShowAddStaffModal(false);
                                            setStaffErrors({});
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={staffSubmitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {staffSubmitting ? 'Adding…' : 'Add Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
