import {
    Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';
import ReportPDFChart from './ReportPDFChart';

// Register a standard font — use Helvetica (built-in, no download needed)
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
        paddingTop: 40,
        paddingBottom: 50,
        paddingHorizontal: 40,
        fontSize: 10,
        color: '#111827',
    },
    // Header
    header: {
        marginBottom: 24,
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB',
        paddingBottom: 12,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    brandName: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: '#2563EB',
        marginRight: 8,
    },
    brandSub: {
        fontSize: 9,
        color: '#6B7280',
        marginTop: 2,
    },
    reportTitle: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        marginTop: 6,
    },
    reportMeta: {
        fontSize: 9,
        color: '#6B7280',
        marginTop: 3,
    },
    // Stats row
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
        padding: 10,
    },
    statLabel: {
        fontSize: 8,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    statValueGreen: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#059669',
    },
    statValueRed: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#DC2626',
    },
    // Section heading
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 16,
    },
    // Table
    table: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1E40AF',
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginBottom: 2,
    },
    tableHeaderCell: {
        color: '#FFFFFF',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tableRowAlt: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#F9FAFB',
    },
    tableCell: {
        fontSize: 9,
        color: '#374151',
    },
    tableCellBold: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    tableCellBlue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#1D4ED8',
    },
    tableCellGreen: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#059669',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF',
    },
    noData: {
        fontSize: 9,
        color: '#9CA3AF',
        fontStyle: 'italic',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    chartContainer: {
        marginBottom: 12
    },
});

import { MONTH_NAMES } from '../../utils/constants';

function formatINR(value) {
    if (value === null || value === undefined) return 'Rs. 0.00';
    return 'Rs. ' + Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}



export default function ReportPDF({ report, selectedMonth, selectedYear, showRoyalty, generatedBy, isFranchisee }) {
    if (!report) return null;

    const monthName = MONTH_NAMES[selectedMonth - 1];
    const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
    const showRoyaltyColumns = showRoyalty && report.royalty_configured === true;
    const profitPositive = report.profit_loss >= 0;

    const showAdminChart = !isFranchisee && report.branches && report.branches.length > 0;

    return (
        <Document title={`Relay Report – ${monthName} ${selectedYear}`} author="Relay FMS">
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.brandRow}>
                        <Text style={styles.brandName}>Relay</Text>
                        <Text style={styles.brandSub}>Franchise Management System</Text>
                    </View>
                    <Text style={styles.reportTitle}>
                        Monthly Performance Report — {monthName} {selectedYear}
                    </Text>
                    <Text style={styles.reportMeta}>
                        Generated: {today}{generatedBy ? `  ·  ${generatedBy}` : ''}
                    </Text>
                </View>

                {/* Summary Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Sales</Text>
                        <Text style={styles.statValueGreen}>{formatINR(report.total_sales)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Expenses</Text>
                        <Text style={styles.statValue}>{formatINR(report.total_expenses)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Profit / Loss</Text>
                        <Text style={profitPositive ? styles.statValueGreen : styles.statValueRed}>
                            {formatINR(report.profit_loss)}
                        </Text>
                    </View>
                </View>

                {/* SVG Bar Chart (Admin Only) */}
                {showAdminChart && (
                    <ReportPDFChart branches={report.branches} styles={styles} />
                )}

                {/* Conditional Branch / Product Breakdown Table */}
                {isFranchisee ? (
                    <>
                        <Text style={styles.sectionTitle}>Product Sales Breakdown</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Product</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Quantity Sold</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Revenue</Text>
                            </View>
                            {(!report.branches || report.branches.length === 0 || !report.branches[0].product_sales || report.branches[0].product_sales.length === 0) ? (
                                <Text style={styles.noData}>No product sales recorded for this period.</Text>
                            ) : (
                                report.branches[0].product_sales.map((prod, idx) => (
                                    <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                        <Text style={[styles.tableCellBold, { flex: 2 }]}>{prod.product_name}</Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                                            {prod.quantity_sold} unit(s)
                                        </Text>
                                        <Text style={[styles.tableCellGreen, { flex: 1.5, textAlign: 'right' }]}>
                                            {formatINR(prod.revenue)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>Branch Breakdown</Text>
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Branch</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Total Sales</Text>
                                {showRoyaltyColumns && (
                                    <>
                                        <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Franchisor Earned</Text>
                                        <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Branch Owner Earned</Text>
                                        <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Cut %</Text>
                                    </>
                                )}
                            </View>

                            {/* Table Rows */}
                            {(!report.branches || report.branches.length === 0) ? (
                                <Text style={styles.noData}>No branch data available for this period.</Text>
                            ) : (
                                report.branches.map((branch, idx) => (
                                    <View key={branch.branch_id ?? idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                        <Text style={[styles.tableCellBold, { flex: 2 }]}>{branch.branch_name}</Text>
                                        <Text style={[styles.tableCellGreen, { flex: 1.5, textAlign: 'right' }]}>
                                            {formatINR(branch.total_sales)}
                                        </Text>
                                        {showRoyaltyColumns && (
                                            <>
                                                <Text style={[styles.tableCellBlue, { flex: 1.5, textAlign: 'right' }]}>
                                                    {formatINR(branch.franchisor_earned)}
                                                </Text>
                                                <Text style={[styles.tableCellGreen, { flex: 1.5, textAlign: 'right' }]}>
                                                    {formatINR(branch.branch_owner_earned)}
                                                </Text>
                                                <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'right' }]}>
                                                    {branch.franchisor_cut_pct}%
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Admin Product Sales Breakdown Sub-Section */}
                        <Text style={styles.sectionTitle} break>Product Sales by Branch</Text>
                        {(!report.branches || report.branches.length === 0) ? (
                            <Text style={styles.noData}>No branch data available for this period.</Text>
                        ) : (
                            report.branches.map((branch, idx) => (
                                <View wrap={false} key={`prod-${branch.branch_id ?? idx}`} style={{ marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 4 }}>
                                    <View style={[styles.tableHeader, { backgroundColor: '#374151', paddingVertical: 4 }]}>
                                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{branch.branch_name}</Text>
                                    </View>
                                    {(!branch.product_sales || branch.product_sales.length === 0) ? (
                                        <Text style={styles.noData}>No product sales recorded for this branch.</Text>
                                    ) : (
                                        branch.product_sales.map((prod, i) => (
                                            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                                <Text style={[styles.tableCellBold, { flex: 2 }]}>{prod.product_name}</Text>
                                                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                                                    {prod.quantity_sold} unit(s)
                                                </Text>
                                                <Text style={[styles.tableCellGreen, { flex: 1.5, textAlign: 'right' }]}>
                                                    {formatINR(prod.revenue)}
                                                </Text>
                                            </View>
                                        ))
                                    )}
                                </View>
                            ))
                        )}
                    </>
                )}
                {/* Expense Breakdown Section */}
                <Text style={styles.sectionTitle} break>Expense Breakdown</Text>
                {(!report.branches || report.branches.length === 0) ? (
                    <Text style={styles.noData}>No expense data available for this period.</Text>
                ) : (
                    report.branches.map((branch, idx) => (
                        <View wrap={false} key={`exp-${branch.branch_id ?? idx}`} style={{ marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 4 }}>
                            {!isFranchisee && (
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{branch.branch_name}</Text>
                                </View>
                            )}
                            {(!branch.expenses || branch.expenses.length === 0) ? (
                                <Text style={styles.noData}>No expenses recorded for this branch.</Text>
                            ) : (
                                branch.expenses.map((exp, i) => (
                                    <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                        <Text style={[styles.tableCellBold, { flex: 2 }]}>{exp.category}</Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                                            {formatINR(exp.amount)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    ))
                )}
                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Relay Franchise Management System — Confidential</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
}
