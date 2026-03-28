export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Relay Franchise Platform</p>
          <p>
            Streamlining franchise operations for growing brands and ambitious branch owners around the globe.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          © {new Date().getFullYear()} Relay Technologies. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
