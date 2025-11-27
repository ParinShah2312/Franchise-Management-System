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
    <div className="bg-background pb-24">
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Built to run modern franchise networks</h1>
          <p className="mt-6 text-lg text-gray-600">
            Relay unifies daily operations, performance analytics, and team collaboration under one scalable platform.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register" className="btn-primary">
              Start your application
            </Link>
            <Link to="/contact" className="btn-outline">
              Talk to our team
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="card">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  {feature.icon}
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h2>
              <p className="mt-3 text-sm text-gray-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-5xl rounded-3xl bg-white px-6 py-16 text-center shadow-xl">
        <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl">Future-proof your franchise network</h2>
        <p className="mt-4 text-lg text-gray-600">
          Relay evolves with your operations—from onboarding new branch owners to supporting managers and staff with
          real-time insights.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/register" className="btn-primary">
            Apply for access
          </Link>
          <Link to="/login" className="btn-outline">
            Log in
          </Link>
        </div>
      </section>
    </div>
  );
}
