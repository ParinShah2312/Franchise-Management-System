export default function StatCard({ title, helper, value, accent = 'neutral' }) {
    const accentClasses = {
        primary: 'bg-blue-50 border border-blue-100 text-blue-900',
        success: 'bg-green-50 border border-green-100 text-green-900',
        neutral: 'bg-gray-50 border border-gray-200 text-gray-900',
    };

    return (
        <div className={`card ${accentClasses[accent] ?? accentClasses.neutral}`}>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
            {helper ? <p className="mt-1 text-xs text-gray-600/80">{helper}</p> : null}
        </div>
    );
}
