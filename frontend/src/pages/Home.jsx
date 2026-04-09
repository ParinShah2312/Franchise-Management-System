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

const roles = [
  {
    title: 'Franchisor',
    color: 'bg-purple-100 text-purple-700',
    description: 'Set global standards, track aggregate network performance, and approve new branches.',
  },
  {
    title: 'Branch Owner',
    color: 'bg-blue-100 text-blue-700',
    description: 'Monitor daily P&L, approve stock requests, and manage managers at specific locations.',
  },
  {
    title: 'Manager',
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Oversee daily shifts, request stock, record deliveries, and view real-time sales.',
  },
  {
    title: 'Staff',
    color: 'bg-amber-100 text-amber-700',
    description: 'Log sales quickly and monitor low stock alerts during an active shift.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 max-w-2xl text-left">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-primary">
                Relay Platform
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Franchise growth starts with a connected operations hub.
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Relay brings franchisors and branch owners together on a modern platform that simplifies onboarding, daily execution, and performance tracking across locations.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
                <Link to="/features" className="btn-outline">
                  Explore Features
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-6 mt-12 border-t border-gray-100 pt-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-sm text-gray-500">{stat.label}</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</dd>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block flex-1 w-full max-w-lg relative">
              <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse mb-6"></div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="h-24 bg-blue-50 rounded-lg border border-blue-100 p-4">
                      <div className="h-4 w-1/2 bg-blue-200 rounded mb-4"></div>
                      <div className="h-8 w-3/4 bg-blue-200 rounded"></div>
                    </div>
                    <div className="h-24 bg-green-50 rounded-lg border border-green-100 p-4">
                      <div className="h-4 w-1/2 bg-green-200 rounded mb-4"></div>
                      <div className="h-8 w-3/4 bg-green-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-40 bg-gray-50 rounded-lg border border-gray-100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for scaling section */}
      <section className="bg-gray-50 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Built for scaling franchise networks</h2>
            <p className="mt-4 text-lg text-gray-600">
              Relay is crafted to keep growing teams aligned—whether you&apos;re launching your first branch or managing dozens worldwide.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {featureHighlights.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-left">
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-3 text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Explainer section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Platform roles designed for your team</h2>
            <p className="mt-4 text-lg text-gray-600">
              A unified experience tailored for each part of your organization.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 text-left">
            {roles.map((role) => (
              <div key={role.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${role.color}`}>
                  {role.title}
                </span>
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner section */}
      <section className="bg-white pb-20 lg:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center shadow-2xl border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Ready to deliver a consistent customer experience?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Join forward-thinking operators leveraging Relay to streamline onboarding, simplify daily execution, and grow their franchise footprint.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-primary">
                Setup your account
              </Link>
              <Link to="/login" className="btn-outline">
                Login to dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
