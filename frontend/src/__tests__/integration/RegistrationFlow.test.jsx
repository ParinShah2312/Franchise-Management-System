import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import RegisterFranchisor from '../../pages/RegisterFranchisor';
import { AuthProvider } from '../../context/AuthContext';
import { api } from '../../api';

// Mock the API
vi.mock('../../api', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        api: {
            post: vi.fn(),
        },
    };
});

describe('RegisterFranchisor Integration Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    const renderComponent = () => render(
        <BrowserRouter>
            <AuthProvider>
                <RegisterFranchisor />
            </AuthProvider>
        </BrowserRouter>
    );

    it('submits the form successfully with valid inputs', async () => {
        api.post.mockResolvedValue({
            token: 'mock-token',
            role: 'FRANCHISOR',
            user: { id: 1, email: 'admin@brand.com', must_reset_password: false },
        });

        renderComponent();

        // Use IDs directly since labels contain asterisks
        const orgInput = screen.getByLabelText(/Organization Name/i);
        const contactInput = screen.getByLabelText(/Contact Person/i);
        const emailInput = screen.getByLabelText(/^Email/i);
        const phoneInput = screen.getByLabelText(/Phone Number/i);
        const passwordInput = screen.getByLabelText(/^Password/i);
        
        fireEvent.change(orgInput, { target: { value: 'My Brand' } });
        fireEvent.change(contactInput, { target: { value: 'Admin User' } });
        fireEvent.change(emailInput, { target: { value: 'admin@brand.com' } });
        fireEvent.change(phoneInput, { target: { value: '9876543210' } });
        fireEvent.change(passwordInput, { target: { value: 'StrongPass1' } });

        const submitBtn = screen.getByRole('button', { name: /create franchisor account/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/register-franchisor', {
                organization_name: 'My Brand',
                contact_person: 'Admin User',
                email: 'admin@brand.com',
                phone: '9876543210',
                password: 'StrongPass1'
            });
        });
    });

    it('shows validation errors for invalid inputs', async () => {
        renderComponent();

        // Use fireEvent.submit on the form to bypass HTML5 native 'required' checks
        // and trigger our custom JS validation (validateForm).
        const form = document.querySelector('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText(/Organization name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/Contact person name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
            expect(api.post).not.toHaveBeenCalled();
        });
    });
});
