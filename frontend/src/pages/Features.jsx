import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Role-Aware Dashboards',
    description:
      'Deliver the right data to franchisors, branch owners, managers, and staff with personalized dashboards and alerts.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.5l6.75-6.75 4.5 4.5L21 3"
      />
    ),
  },
  {
    title: 'Inventory Intelligence',
    description:
      'Track stock across every branch, set reorder points, and forecast needs with transaction history at your fingertips.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 5.25l7.5 4.5 7.5-4.5m-15 6l7.5 4.5 7.5-4.5m-15 6l7.5 4.5 7.5-4.5"
      />
    ),
  },
  {
    title: 'Automated Workflows',
    description:
      'Standardize onboarding, approvals, and daily checklists to keep every location compliant with brand standards.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 9.75l7.5-6 7.5 6M3 19.5h18"
      />
    ),
  },
  {
    title: 'Financial Clarity',
    description:
      'Monitor sales, royalties, and operational expenses to maximize profitability across the entire franchise network.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10.5l6.75-6.75L13.5 7.5l7.5-7.5"
      />
    ),
  },
  {
    title: 'Staff Collaboration',
    description:
      'Assign shifts, manage permissions, and empower teams with communication tools tuned for on-the-go operators.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 7.5l4.5 4.5-4.5 4.5M7.5 16.5l-4.5-4.5 4.5-4.5"
      />
    ),
  },
  {
    title: 'Analytics & Reporting',
    description:
      'Turn raw data into actionable insights with ready-made reports covering customer demand, staffing, and revenue trends.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 19.5l3-3 3 3 9-9"
      />
    ),
  },
];

export default function Features() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-white py-20 lg:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Built to run modern franchise networks
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Relay unifies daily operations, performance analytics, and team collaboration under one scalable platform.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn-primary">
              Start your application
            </Link>
            <Link to="/contact" className="btn-outline">
              Talk to our team
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-gray-50 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-start">
                <div className="flex w-14 h-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner section */}
      <section className="bg-gray-50 pb-20 lg:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center shadow-2xl border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Future-proof your franchise network
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Relay evolves with your operations—from onboarding new branch owners to supporting managers and staff with real-time insights.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-primary">
                Apply for access
              </Link>
              <Link to="/login" className="btn-outline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
