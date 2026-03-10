import { useState } from 'react';

export default function FranchiseeStaff({ staff, appointManager, setToast }) {
    const [showManagerModal, setShowManagerModal] = useState(false);
    const [managerSubmitting, setManagerSubmitting] = useState(false);
    const [managerForm, setManagerForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    });

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
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
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{staff.manager.name}</p>
                                <p className="text-sm text-gray-600">{staff.manager.email}</p>
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
                    <div className="divide-y divide-gray-100">
                        {staff.team.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-500">No staff members linked to this branch.</p>
                        ) : (
                            staff.team.map((member) => (
                                <div key={member.user_id} className="px-4 py-3">
                                    <p className="text-sm font-medium text-gray-800">{member.name}</p>
                                    <p className="text-sm text-gray-600">{member.email}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showManagerModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800">Appoint Branch Manager</h3>
                            <button
                                type="button"
                                onClick={() => !managerSubmitting && setShowManagerModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close manager modal"
                            >
                                ✕
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
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_name">
                                    Full Name*
                                </label>
                                <input
                                    id="manager_name"
                                    type="text"
                                    required
                                    value={managerForm.name}
                                    onChange={(event) => setManagerForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Riya Sharma"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="manager_email">
                                    Email*
                                </label>
                                <input
                                    id="manager_email"
                                    type="email"
                                    required
                                    value={managerForm.email}
                                    onChange={(event) => setManagerForm((prev) => ({ ...prev, email: event.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="manager@relay.com"
                                />
                            </div>

                            <div className="space-y-1">
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="min 8 characters"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => !managerSubmitting && setShowManagerModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={managerSubmitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {managerSubmitting ? 'Saving…' : 'Appoint Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
