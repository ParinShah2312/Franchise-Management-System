import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const navLinks = [
  { name: 'Home', to: '/' },
  { name: 'Features', to: '/features' },
  { name: 'Contact', to: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10m-6 5h6" />
            </svg>
          </span>
          Relay
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'}`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="btn-outline px-5 py-2 text-sm">
            Log In
          </Link>
          <Link to="/register" className="btn-primary px-5 py-2 text-sm">
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-gray-600 transition hover:text-primary md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-border/70 bg-white md:hidden">
          <div className="space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-blue-50 hover:text-primary'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-outline w-full">
                Log In
              </Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="btn-primary w-full">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
