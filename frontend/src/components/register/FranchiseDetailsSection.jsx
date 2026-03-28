export default function FranchiseDetailsSection({
  franchiseId,
  proposedLocation,
  brandOptions,
  loadingBrands,
  brandsError,
  formErrors,
  onChange,
  onFileChange,
  fileInputRef,
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Franchise Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="franchise_id">
            Select Franchise Brand*
          </label>
          <select
            id="franchise_id"
            name="franchise_id"
            required
            disabled={loadingBrands || brandOptions.length === 0}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={franchiseId}
            onChange={onChange}
          >
            <option value="">{loadingBrands ? 'Loading brands…' : 'Select a franchise brand'}</option>
            {brandOptions.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          {brandsError ? <p className="mt-1 text-xs text-amber-600">{brandsError}</p> : null}
          {formErrors.franchise_id ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.franchise_id}</p>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="proposed_location">
            Proposed Location (City, State)*
          </label>
          <input
            id="proposed_location"
            name="proposed_location"
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Austin, TX"
            value={proposedLocation}
            onChange={onChange}
          />
          {formErrors.proposed_location ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.proposed_location}</p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="application_file">
            Application Document (PDF/JPG/PNG)*
          </label>
          <input
            id="application_file"
            name="application_file"
            type="file"
            required
            ref={fileInputRef}
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={onFileChange}
          />
          <p className="mt-1 text-xs text-gray-500">Attach your government ID or business plan supporting this expansion request.</p>
          {formErrors.application_file ? (
            <p className="mt-1 text-xs text-red-600">{formErrors.application_file}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
