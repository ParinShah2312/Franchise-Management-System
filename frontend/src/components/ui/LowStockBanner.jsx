export default function LowStockBanner({ items, onDismiss }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
      <svg className="h-5 w-5 text-amber-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-amber-800">
          {items.length} item{items.length === 1 ? '' : 's'} low on stock
        </h4>
        <p className="text-sm text-amber-700 mt-0.5">
          {items.map((item, index) => {
            const name = item.stock_item_name || item.item_name || 'Unknown item';
            const quantity = item.quantity || 0;
            return (
              <span key={item.stock_item_id || item.id || index}>
                {name} ({quantity} remaining){index < items.length - 1 ? ', ' : ''}
              </span>
            );
          })}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-amber-400 hover:text-amber-600 transition-colors p-0.5"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
