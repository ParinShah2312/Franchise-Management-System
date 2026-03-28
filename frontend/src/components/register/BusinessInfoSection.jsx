export default function BusinessInfoSection({
  investmentCapacity,
  businessExperience,
  reason,
  formErrors,
  onChange,
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Business Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="investment_capacity">
            Investment Capacity (INR)*
          </label>
          <input
            id="investment_capacity"
            name="investment_capacity"
            type="number"
            min="0"
            step="1"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="150000"
            value={investmentCapacity}
            onChange={onChange}
          />
          <p className="mt-1 text-xs text-gray-500">Enter a whole number (e.g. 150000 for ₹1.5L).</p>
          {formErrors.investment_capacity ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.investment_capacity}</p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="business_experience">
            Business Experience*
          </label>
          <textarea
            id="business_experience"
            name="business_experience"
            required
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your relevant business experience"
            value={businessExperience}
            onChange={onChange}
          />
          {formErrors.business_experience ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.business_experience}</p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reason_for_franchise">
            Why do you want to open a Relay franchise?*
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about your motivation and goals"
            value={reason}
            onChange={onChange}
          />
          {formErrors.reason ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.reason}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
