import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  /** False until the persisted store has been read back from localStorage. */
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password });
          if (typeof window !== 'undefined') {
            localStorage.setItem('pj_token', data.access_token);
          }
          set({ user: data.user, token: data.access_token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pj_token');
        }
        set({ user: null, token: null });
        window.location.href = '/auth/login';
      },

      setUser: (user) => set({ user }),

      refreshUser: async () => {
        try {
          const { data } = await authApi.me();
          set({ user: data });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'pj_auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      // Route guards must not run before this fires, otherwise a signed in
      // user is redirected to the login page on every hard refresh.
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

// Role helpers. One administrator role covers the whole admin area, so there
// is nothing finer to test for than these two.
export const isAdmin = (user: User | null) => user?.role === 'admin';

export const isReviewer = (user: User | null) =>
  user?.role === 'admin' || user?.role === 'reviewer';
