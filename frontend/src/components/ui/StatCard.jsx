export default function StatCard({ title, helper, value, accent = 'neutral' }) {
    const accentClasses = {
        primary: 'border-blue-100/60 ring-1 ring-blue-50/50 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_12px_-3px_rgba(59,130,246,0.15)]',
        success: 'border-green-100/60 ring-1 ring-green-50/50 shadow-[0_2px_10px_-3px_rgba(34,197,94,0.1)] hover:shadow-[0_4px_12px_-3px_rgba(34,197,94,0.15)]',
        neutral: 'border-gray-100 shadow-sm hover:shadow-md',
    };

    return (
        <div className={`card ${accentClasses[accent] ?? accentClasses.neutral}`}>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-3 text-2xl font-semibold text-gray-800">{value}</p>
            {helper ? <p className="mt-1 text-xs text-gray-400">{helper}</p> : null}
        </div>
    );
}
