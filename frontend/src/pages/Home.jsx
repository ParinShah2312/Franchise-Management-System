import { Link } from 'react-router-dom';

const stats = [
  { label: 'Franchises onboarded', value: '120+' },
  { label: 'Daily operations automated', value: '85%' },
  { label: 'Average ROI increase', value: '32%' },
];

const featureHighlights = [
  {
    title: 'Centralized Operations',
    description:
      'Monitor performance, inventory, and staff in a unified dashboard purpose-built for franchise networks.',
  },
  {
    title: 'Role-Based Workflows',
    description:
      'Empower franchisors, branch owners, managers, and staff with tailored access and streamlined processes.',
  },
  {
    title: 'Actionable Insights',
    description:
      'Track KPIs and receive alerts to stay ahead of operational bottlenecks and growth opportunities.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-24 bg-background pb-24">
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto flex max-w-6xl flex-col-reverse gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Relay Platform
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Franchise growth starts with a connected operations hub.
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Relay brings franchisors and branch owners together on a modern platform that simplifies onboarding,
              daily execution, and performance tracking across locations.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
              <Link to="/features" className="btn-outline">
                Explore Features
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-1 gap-6 text-sm text-gray-600 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="card border-none bg-blue-50/60 shadow-none">
                  <dt className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</dt>
                  <dd className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative flex flex-1 justify-center">
            <div className="relative w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12.75l8.954-8.955c.44-.439 1.152-.439 1.591 0l8.955 8.955M4.5 10.5v9.75A1.5 1.5 0 006 21.75h3.75v-5.25a1.5 1.5 0 011.5-1.5h2.25a1.5 1.5 0 011.5 1.5v5.25H21a1.5 1.5 0 001.5-1.5V10.5"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Unified Franchise Ops</p>
                  <p className="text-xs text-gray-500">Visibility and control across the entire network.</p>
                </div>
              </div>
              <div className="space-y-4 text-sm text-gray-600">
                <p>
                  • Automate franchise onboarding and ensure every location stays compliant with brand standards.
                </p>
                <p>
                  • Give branch owners, managers, and staff the tools they need to collaborate in real time.
                </p>
                <p>• Unlock data-driven decisions with dashboards highlighting performance and inventory health.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl">Built for scaling franchise networks</h2>
          <p className="mt-4 text-lg text-gray-600">
            Relay is crafted to keep growing teams aligned—whether you&apos;re launching your first branch or managing
            dozens worldwide.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featureHighlights.map((feature) => (
            <article key={feature.title} className="card">
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-3 text-sm text-gray-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 rounded-3xl bg-white px-6 py-16 text-center shadow-xl">
        <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
          Ready to deliver a consistent customer experience across every branch?
        </h2>
        <p className="max-w-2xl text-lg text-gray-600">
          Join forward-thinking operators leveraging Relay to streamline onboarding, simplify daily execution, and grow
          their franchise footprint without added chaos.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="btn-primary">
            Apply for a Branch
          </Link>
          <Link to="/login" className="btn-outline">
            Log In
          </Link>
        </div>
      </section>
    </div>
  );
}
