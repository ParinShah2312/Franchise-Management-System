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
        api.post.mockResolvedValueOnce({
            token: 'mock-token',
            user: { id: 1, email: 'admin@brand.com', role: 'FRANCHISOR', must_reset_password: false },
        });

        renderComponent();

        const orgInput = screen.getByLabelText(/Organization Name/i);
        const contactInput = screen.getByLabelText(/Contact Person/i);
        const emailInput = screen.getByLabelText(/Email Address/i);
        const phoneInput = screen.getByLabelText(/Phone Number/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        
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

        await waitFor(() => {
            expect(screen.getByText(/Registration successful/i)).toBeInTheDocument();
        });
    });

    it('shows validation errors for invalid inputs', async () => {
        renderComponent();
        const submitBtn = screen.getByRole('button', { name: /create franchisor account/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Organization name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/Contact person name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
            // phone and password validation will also trigger but the assertions above prove validation intercepts the submit.
            expect(api.post).not.toHaveBeenCalled();
        });
    });
});
