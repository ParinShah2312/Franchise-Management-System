export default function PersonalInfoSection({ name, phone, formErrors, onChange, onPhoneChange }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
            Full Name*
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
            value={name}
            onChange={onChange}
          />
          {formErrors.name ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
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
            maxLength={10}
            onChange={onPhoneChange}
          />
          {formErrors.phone ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
