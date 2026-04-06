import { render, screen } from '@testing-library/react';
import StatCard from '../../components/ui/StatCard';

describe('StatCard', () => {
    it('renders the title and value correctly', () => {
        render(<StatCard title="Total Sales" value="₹1000" />);
        expect(screen.getByText('Total Sales')).toBeInTheDocument();
        expect(screen.getByText('₹1000')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
        render(<StatCard title="Revenue" value="₹5000" helper="+10% from last month" />);
        expect(screen.getByText('+10% from last month')).toBeInTheDocument();
    });

    it('does not render helper when not provided', () => {
        const { container } = render(<StatCard title="Revenue" value="₹5000" />);
        // value, title, and wrapper div.
        expect(container.querySelectorAll('p')).toHaveLength(2);
    });
});
