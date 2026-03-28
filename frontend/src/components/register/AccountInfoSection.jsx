export default function AccountInfoSection({
  email,
  password,
  showPassword,
  formErrors,
  onChange,
  onTogglePassword,
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Account Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email*
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@example.com"
            value={email}
            onChange={onChange}
          />
          {formErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            Password*
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-14"
              placeholder="Create a strong password"
              value={password}
              onChange={onChange}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {formErrors.password ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
