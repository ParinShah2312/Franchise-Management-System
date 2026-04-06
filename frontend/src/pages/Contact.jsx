import { useState } from 'react';

const initialState = {
  name: '',
  email: '',
  company: '',
  message: '',
};

export default function Contact() {
  const [formState, setFormState] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setFormState(initialState);
  };

  return (
    <div className="flex flex-col bg-gray-50 pb-20 lg:pb-24">
      {/* Hero Section */}
      <section className="bg-white py-20 lg:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Let&apos;s build your franchise success story
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Share a few details and our team will reach out to walk you through Relay&apos;s capabilities for your franchise or multi-location brand.
          </p>
        </div>
      </section>

      {/* Form Card */}
      <section className="max-w-3xl w-full mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="name">
                Full name
              </label>
              <input
                className="w-full rounded-lg border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                id="name"
                name="name"
                type="text"
                placeholder="Alex Johnson"
                value={formState.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="email">
                  Work email
                </label>
                <input
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="alex@brand.com"
                  value={formState.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="company">
                  Company / Franchise name
                </label>
                <input
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Relay Foods"
                  value={formState.company}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="message">
                How can we help?
              </label>
              <textarea
                className="w-full rounded-lg border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm min-h-[140px]"
                id="message"
                name="message"
                placeholder="Tell us about your franchise operations, goals, or challenges."
                value={formState.message}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button type="submit" className="w-full sm:w-auto btn-primary">
                Submit message
              </button>
              {submitted && (
                <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">
                  Thanks! We&apos;ll be in touch shortly.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Direct Contact Banner */}
      <section className="max-w-5xl w-full mx-auto px-4 sm:px-6 mt-20">
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center shadow-lg border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Prefer to talk now?</h2>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Reach out directly. Email us at <span className="font-semibold text-blue-600">hello@relayhq.com</span> or call <span className="font-semibold text-blue-600">+1 (800) 555-0199</span> to connect with our franchise growth specialists.
          </p>
        </div>
      </section>
    </div>
  );
}
