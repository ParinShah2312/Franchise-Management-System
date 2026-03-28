export default function ContactInfoSection({
  email,
  phone,
  password,
  showPassword,
  formErrors,
  onChange,
  onPhoneChange,
  onTogglePassword,
}) {
  return (
    <>
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
          placeholder="you@example.com"
          value={email}
          onChange={onChange}
        />
        {formErrors.email ? (
          <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
        ) : null}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
          Phone Number*
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="5551234567"
          value={phone}
          onChange={onPhoneChange}
          maxLength={10}
        />
        {formErrors.phone ? (
          <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
        ) : null}
      </div>
      <div className="md:col-span-2">
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
            placeholder="Create a secure password"
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
    </>
  );
}
