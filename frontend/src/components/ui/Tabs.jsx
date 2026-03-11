export default function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <nav className="mb-8 flex flex-wrap items-center gap-1 p-1 bg-gray-50/80 border border-gray-100 rounded-xl w-fit shadow-sm">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.key
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}
