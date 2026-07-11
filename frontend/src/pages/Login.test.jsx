import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  authService: {
    loginWithPassword: jest.fn(),
  },
}));

// Create a wrapper to provide routing and auth context
const Wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form correctly', () => {
    render(<Login />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('successfully logs in a user and redirects', async () => {
    // Setup the API mock to resolve
    authService.loginWithPassword.mockResolvedValueOnce({
      data: {
        data: {
          token: 'fake-jwt-token',
        },
      },
    });

    render(<Login />, { wrapper: Wrapper });

    // Fill out the form
    const mobileInput = screen.getByLabelText(/mobile number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(mobileInput, { target: { value: '9990000001' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(loginButton);

    // Button should show loading state
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();

    // Verify API was called
    await waitFor(() => {
      expect(authService.loginWithPassword).toHaveBeenCalledWith('9990000001', 'password123');
    });

    // Verify token was stored
    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
  });

  it('displays error message on failed login', async () => {
    // Setup the API mock to reject
    authService.loginWithPassword.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });

    render(<Login />, { wrapper: Wrapper });

    const mobileInput = screen.getByLabelText(/mobile number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(mobileInput, { target: { value: '9990000001' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    fireEvent.click(loginButton);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Ensure token is not set
    expect(localStorage.getItem('token')).toBeNull();
  });
});
