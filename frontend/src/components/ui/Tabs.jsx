export default function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <div className="relative">
            <nav className="mb-8 overflow-x-auto scrollbar-hide -mx-1 px-1">
                <div className="flex items-center gap-1 w-max min-w-full p-1 bg-gray-50/80 border border-gray-100 rounded-xl shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                activeTab === tab.key
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                            }`}
                        >
                            <span className="inline-flex items-center gap-2">
                                {tab.label}
                                {tab.badge ? (
                                    <span className="inline-flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full px-2 ml-1">
                                        {tab.badge}
                                    </span>
                                ) : null}
                            </span>
                        </button>
                    ))}
                </div>
            </nav>
            {/* Scroll fade indicator — only visible on small screens */}
            <div
                className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-gray-50 to-transparent sm:hidden"
                aria-hidden="true"
            />
        </div>
    );
}
