export default function OrgInfoSection({
  organizationName,
  contactPerson,
  formErrors,
  onChange,
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="organization_name">
          Organization Name*
        </label>
        <input
          id="organization_name"
          name="organization_name"
          type="text"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Relay Coffee Brands"
          value={organizationName}
          onChange={onChange}
        />
        {formErrors.organization_name ? (
          <p className="mt-1 text-xs text-red-600">{formErrors.organization_name}</p>
        ) : null}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact_person">
          Contact Person*
        </label>
        <input
          id="contact_person"
          name="contact_person"
          type="text"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Jordan Smith"
          value={contactPerson}
          onChange={onChange}
        />
        {formErrors.contact_person ? (
          <p className="mt-1 text-xs text-red-600">{formErrors.contact_person}</p>
        ) : null}
      </div>
    </>
  );
}
