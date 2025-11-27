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
    <div className="bg-background pb-24">
      <section className="bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Let&apos;s build your franchise success story</h1>
          <p className="text-lg text-gray-600">
            Share a few details and our team will reach out to walk you through Relay&apos;s capabilities for your
            franchise or multi-location brand.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6">
        <div className="card p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                className="input-field"
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
                <label className="label" htmlFor="email">
                  Work email
                </label>
                <input
                  className="input-field"
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
                <label className="label" htmlFor="company">
                  Company / Franchise name
                </label>
                <input
                  className="input-field"
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
              <label className="label" htmlFor="message">
                How can we help?
              </label>
              <textarea
                className="input-field min-h-[140px]"
                id="message"
                name="message"
                placeholder="Tell us about your franchise operations, goals, or challenges."
                value={formState.message}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" className="btn-primary">
                Submit
              </button>
              {submitted ? <p className="text-sm text-green-600">Thanks! We&apos;ll be in touch shortly.</p> : null}
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-5xl rounded-3xl bg-white px-6 py-16 text-center shadow-xl">
        <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl">Prefer to talk now?</h2>
        <p className="mt-4 text-lg text-gray-600">
          Email us at <span className="font-semibold text-primary">hello@relayhq.com</span> or call
          <span className="font-semibold text-primary"> +1 (800) 555-0199</span> to connect with our franchise growth
          specialists.
        </p>
      </section>
    </div>
  );
}
