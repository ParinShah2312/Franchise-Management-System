import React, { useState } from 'react';
import Table from '../ui/Table';
import { formatINRDecimal } from '../../utils/formatters';

/**
 * On-screen branch breakdown table with expandable product sales rows.
 * Extracted from ReportCard to keep component sizes manageable.
 */
export default function ReportBranchTable({ branches, tableHeaders, showRoyaltyColumns }) {
  const [expandedBranchId, setExpandedBranchId] = useState(null);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 mt-8">
        Branch Breakdown
      </h3>
      <Table
        headers={tableHeaders}
        data={branches || []}
        emptyMessage="No branch data available for this period."
        renderRow={(branch, idx) => {
          const isExpanded = expandedBranchId === branch.branch_id;
          return (
            <React.Fragment key={branch.branch_id ?? idx}>
              <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                <td className="px-6 py-4 font-medium text-gray-800">{branch.branch_name}</td>
                <td className="px-6 py-4 text-gray-700">{formatINRDecimal(branch.total_sales)}</td>
                {showRoyaltyColumns && (
                  <>
                    <td className="px-6 py-4 text-gray-700">{formatINRDecimal(branch.franchisor_earned)}</td>
                    <td className="px-6 py-4 text-gray-700">{formatINRDecimal(branch.branch_owner_earned)}</td>
                    <td className="px-6 py-4 text-gray-700">{branch.franchisor_cut_pct}%</td>
                  </>
                )}
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedBranchId(isExpanded ? null : branch.branch_id)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {isExpanded ? 'Hide' : 'View Sales Breakdown'}
                  </button>
                </td>
              </tr>
              {isExpanded && (
                <tr className="bg-gray-50 border-b border-gray-100">
                  <td colSpan={tableHeaders.length} className="px-6 py-6">
                    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                      <h4 className="mb-4 text-sm font-bold text-gray-800 uppercase tracking-wider">Product Sales for {branch.branch_name}</h4>
                      {(!branch.product_sales || branch.product_sales.length === 0) ? (
                        <p className="text-sm text-gray-500 italic">No products sold in this period.</p>
                      ) : (
                        <ul className="space-y-3">
                          {branch.product_sales.map((prod, i) => (
                            <li key={i} className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                              <span className="font-medium text-gray-900">{prod.product_name}</span>
                              <span className="text-right">
                                <span className="mr-6 text-gray-500">{prod.quantity_sold} unit(s)</span>
                                <span className="font-medium text-gray-800">{formatINRDecimal(prod.revenue)}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        }}
      />
    </div>
  );
}
