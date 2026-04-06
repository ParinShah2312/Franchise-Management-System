import { Text, View, Svg, Rect, Line, G } from '@react-pdf/renderer';

/**
 * SVG bar chart for the PDF report (Admin view only).
 * Extracted from ReportPDF to keep component sizes manageable.
 */

function formatAxisValue(v) {
  if (v >= 100000) return 'Rs. ' + (v / 100000).toFixed(1) + 'L';
  if (v >= 1000) return 'Rs. ' + (v / 1000).toFixed(1) + 'K';
  return 'Rs. ' + v;
}

export default function ReportPDFChart({ branches, styles }) {
  if (!branches || branches.length === 0) return null;

  const maxSales = Math.max(...branches.map(b => b.total_sales || 0), 1);

  // Dimensions
  const chartWidth = 515;
  const chartHeight = 160;
  const leftPad = 70;
  const rightPad = 20;
  const topPad = 20;
  const bottomPad = 30;
  const chartAreaWidth = chartWidth - leftPad - rightPad;
  const chartAreaHeight = chartHeight - topPad - bottomPad;

  const barWidth = Math.min(40, (chartAreaWidth / branches.length) - 8);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Sales by Branch</Text>
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grid Lines & Y Axis Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = topPad + chartAreaHeight - (ratio * chartAreaHeight);
          const val = ratio * maxSales;
          return (
            <G key={`grid-${i}`}>
              <Text x={65} y={y + 3} fontSize={7} fill="#9CA3AF" textAnchor="end">
                {formatAxisValue(val)}
              </Text>
              <Line x1={leftPad} y1={y} x2={leftPad + chartAreaWidth} y2={y} strokeWidth={0.5} stroke="#E5E7EB" />
            </G>
          );
        })}

        {/* Bars & X Axis Labels */}
        {branches.map((branch, i) => {
          const sales = branch.total_sales || 0;
          const barHeight = (sales / maxSales) * chartAreaHeight;
          const xCenter = leftPad + i * (chartAreaWidth / branches.length) + (chartAreaWidth / branches.length) / 2;
          const x = xCenter - (barWidth / 2);
          const y = topPad + chartAreaHeight - barHeight;

          const label = branch.branch_name.length > 12
            ? branch.branch_name.substring(0, 12) + '...'
            : branch.branch_name;

          return (
            <G key={`bar-${i}`}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} fill="#2563EB" rx={2} />
              <Text x={xCenter} y={topPad + chartAreaHeight + 15} fontSize={7} fill="#6B7280" textAnchor="middle">
                {label}
              </Text>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
