export default function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <nav className="mb-8 flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === tab.key
                            ? 'bg-primary text-white shadow'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}
