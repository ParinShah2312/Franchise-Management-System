import { Link } from 'react-router-dom';

export default function SignupSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Choose Your Path</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Tell us how you&apos;d like to join the Relay network. Start a new brand from scratch or
            apply to operate an existing franchise location in our system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/register/franchisor"
            className="group border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition flex flex-col"
          >
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Register as Franchisor</h2>
              <p className="text-gray-500 text-sm">
                I want to onboard my brand, configure products, and manage franchise expansion as a
                brand owner.
              </p>
            </div>
            <div className="mt-6 text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Start a New Brand →
            </div>
          </Link>

          <Link
            to="/register/franchise"
            className="group border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition flex flex-col"
          >
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Apply for a Branch</h2>
              <p className="text-gray-500 text-sm">
                I want to open a branch of an existing franchise. I&apos;m ready to submit a franchisee
                application for review.
              </p>
            </div>
            <div className="mt-6 text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Apply as Branch Owner →
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
