import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import LowStockBanner from '../../components/ui/LowStockBanner';

describe('LowStockBanner', () => {
    it('returns null if no items provided', () => {
        const { container } = render(<LowStockBanner items={[]} onDismiss={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders singular message for 1 item', () => {
        const items = [{ stock_item_name: 'Coffee Beans', quantity: 5 }];
        render(<LowStockBanner items={items} onDismiss={() => {}} />);
        expect(screen.getByText('1 item low on stock')).toBeInTheDocument();
        expect(screen.getByText(/Coffee Beans \(5 remaining\)/)).toBeInTheDocument();
    });

    it('renders plural message for multiple items', () => {
        const items = [
            { stock_item_name: 'Coffee Beans', quantity: 5 },
            { stock_item_name: 'Sugar', quantity: 2 }
        ];
        render(<LowStockBanner items={items} onDismiss={() => {}} />);
        expect(screen.getByText('2 items low on stock')).toBeInTheDocument();
        // Since React breaks up text across span boundaries inside map, getByText with simple string matcher might fail depending on DOM structure.
        // It outputs "Coffee Beans (5 remaining), Sugar (2 remaining)".
        // Wait, the component implementation uses a span per item, concatenated by a reduce. Let's just check the text content.
        expect(screen.getByText(/Coffee Beans \(5 remaining\)/)).toBeInTheDocument();
        expect(screen.getByText(/Sugar \(2 remaining\)/)).toBeInTheDocument();
    });

    it('calls onDismiss when close button is clicked', () => {
        const handleDismiss = vi.fn();
        const items = [{ stock_item_name: 'Milk', quantity: 1 }];
        render(<LowStockBanner items={items} onDismiss={handleDismiss} />);
        
        const closeButton = screen.getByRole('button', { name: /dismiss banner/i });
        fireEvent.click(closeButton);
        expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
});
