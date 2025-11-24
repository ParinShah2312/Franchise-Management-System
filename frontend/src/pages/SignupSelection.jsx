import { Link } from 'react-router-dom';

export default function SignupSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Choose Your Path</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Tell us how you&apos;d like to join the Relay network. Franchise owners get full access to
            manage their location, while staff members can quickly connect to their team&apos;s
            operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/register/franchise"
            className="group border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition flex flex-col"
          >
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Become a Franchisee</h2>
              <p className="text-gray-500 text-sm">
                I want to open and manage a new Relay franchise. I&apos;m ready to submit a full
                application for review.
              </p>
            </div>
            <div className="mt-6 text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Apply as Franchise Owner →
            </div>
          </Link>

          <Link
            to="/register/staff"
            className="group border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition flex flex-col"
          >
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <span className="text-2xl">🧑‍💼</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Join as Staff</h2>
              <p className="text-gray-500 text-sm">
                I am an employee joining an existing franchise team. I&apos;ll provide my franchise ID to
                connect with the right location.
              </p>
            </div>
            <div className="mt-6 text-green-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Register as Staff Member →
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
