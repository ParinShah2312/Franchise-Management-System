export default function Table({ headers, data, renderRow, emptyMessage }) {
    if (!data || data.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-white py-12 text-center text-gray-500">
                {emptyMessage || 'No data available.'}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((heading) => (
                            <th
                                key={heading}
                                scope="col"
                                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                            >
                                {heading}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                    {data.map((item, index) => renderRow(item, index))}
                </tbody>
            </table>
        </div>
    );
}
