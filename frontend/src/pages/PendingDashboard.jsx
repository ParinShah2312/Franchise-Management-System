import { useAuth } from '../context/AuthContext';

export default function PendingDashboard() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100">
            <svg
              className="h-8 w-8 text-amber-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Application Pending</h2>
          <p className="mt-2 text-sm text-gray-600">
            Hi {user?.name || 'there'}, your franchise application has been successfully submitted and is currently being reviewed by the brand's administration team.
          </p>
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            We will notify you via email as soon as a decision is made. Check back later for updates.
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={logout}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sign out for now
          </button>
        </div>
      </div>
    </div>
  );
}
