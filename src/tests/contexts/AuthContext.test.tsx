// src/tests/contexts/AuthContext.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from '@/contexts/AuthContext';
import { useContext } from 'react';

const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

const createMockSupabase = () => ({
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession,
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    onAuthStateChange: mockOnAuthStateChange,
  },
  from: mockFrom,
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

vi.mock('@/actions/auth', () => ({
  signUpWithEmail: vi.fn(),
  resetPassword: vi.fn(),
}));

let lastSignInResult: { error?: string } | undefined;

function TestConsumer() {
  const ctx = useContext(AuthContext);
  if (!ctx) return <div>no context</div>;

  return (
    <div>
      <div data-testid="loading">{ctx.isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="authenticated">{ctx.isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="email">{ctx.profile?.email || 'no-email'}</div>
      <div data-testid="role">{ctx.profile?.role || 'no-role'}</div>
      <div data-testid="admin">{ctx.hasRole('ADMIN') ? 'admin' : 'not-admin'}</div>
      <button
        data-testid="signin"
        onClick={async () => {
          lastSignInResult = await ctx.signIn('a@b.com', 'password');
        }}
      >
        Sign In
      </button>
      <button data-testid="signout" onClick={() => ctx.signOut()}>
        Sign Out
      </button>
      <button
        data-testid="refresh"
        onClick={async () => {
          await ctx.refreshUser();
        }}
      >
        Refresh
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    });
  });

  afterEach(() => {
    lastSignInResult = undefined;
  });

  it('starts in loading state', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
  });

  it('sets unauthenticated state when no user is logged in', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(screen.getByTestId('email')).toHaveTextContent('no-email');
  });

  it('sets authenticated state and loads basic profile from user metadata', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      user_metadata: { full_name: 'Test User' },
    };
    mockGetSession.mockResolvedValue({ data: { session: { user } }, error: null });
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('yes'));
    expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('role')).toHaveTextContent('CLIENTE');
  });

  it('loads full profile from database when available', async () => {
    const user = {
      id: 'user-2',
      email: 'db@example.com',
      created_at: new Date().toISOString(),
      user_metadata: {},
    };
    const profile = {
      id: 'user-2',
      email: 'db@example.com',
      full_name: 'DB User',
      role: 'ADMIN',
      avatar_url: null,
      phone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockGetSession.mockResolvedValue({ data: { session: { user } }, error: null });
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: profile, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: profile, error: null })),
          })),
        })),
      })),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('ADMIN'));
    expect(screen.getByTestId('email')).toHaveTextContent('db@example.com');
    expect(screen.getByTestId('admin')).toHaveTextContent('admin');
  });

  it('returns error from signIn when authentication fails', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

    await act(async () => {
      screen.getByTestId('signin').click();
    });

    expect(lastSignInResult).toEqual({ error: 'Invalid credentials' });
  });

  it('calls supabase signOut when signOut is invoked', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSignOut.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

    await act(async () => {
      screen.getByTestId('signout').click();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('refreshes user state when refreshUser is called', async () => {
    const user = {
      id: 'user-3',
      email: 'refresh@example.com',
      created_at: new Date().toISOString(),
      user_metadata: {},
    };
    mockGetSession.mockReturnValue({ data: { session: null }, error: null });
    mockGetUser.mockReturnValue({ data: { user: null }, error: null });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('no'));

    mockGetSession.mockReturnValue({ data: { session: { user } }, error: null });
    mockGetUser.mockReturnValue({ data: { user }, error: null });

    await act(async () => {
      screen.getByTestId('refresh').click();
    });

    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('yes'));
    expect(screen.getByTestId('email')).toHaveTextContent('refresh@example.com');
  });
});
