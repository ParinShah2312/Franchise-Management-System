import PropTypes from 'prop-types';

export default function Table({ headers, data, renderRow, emptyMessage, children }) {
    const hasChildren = children && (!Array.isArray(children) || children.length > 0);
    const hasData = data && data.length > 0;

    if (!hasData && !hasChildren) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-white py-12 text-center text-gray-500">
                {emptyMessage || 'No data available.'}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            {headers.map((heading) => (
                                <th
                                    key={heading}
                                    scope="col"
                                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white text-sm">
                        {children ? children : data?.map((item, index) => renderRow(item, index))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

Table.propTypes = {
    headers: PropTypes.arrayOf(PropTypes.string).isRequired,
    data: PropTypes.array,
    renderRow: PropTypes.func,
    emptyMessage: PropTypes.string,
    children: PropTypes.node,
};
