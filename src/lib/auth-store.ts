import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { authApi } from '@/lib/api';

/**
 * Roles that existed before they were collapsed to admin / reviewer / user.
 *
 * A browser signed in before that change still has the old name in
 * localStorage, and because nothing here matches it any more the person
 * silently loses every administrator link until they sign out. Mapping them on
 * rehydrate repairs the session in place.
 */
const LEGACY_ROLES: Record<string, UserRole> = {
  super_admin: 'admin',
  journal_admin: 'admin',
  conference_admin: 'admin',
};

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
  syncUser: () => Promise<void>;
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

      syncUser: async () => {
        // Quietly bring the cached account back in step with the server, so a
        // role an administrator changed reaches this browser without a sign
        // out. Unlike refreshUser this never signs anyone out: the response
        // interceptor already handles a real 401, and a transient network
        // failure must not throw someone out of a working session.
        if (!get().token) return;
        try {
          const { data } = await authApi.me();
          set({ user: data });
        } catch {
          /* keep the session as it stands */
        }
      },
    }),
    {
      name: 'pj_auth',
      version: 2,
      partialize: (state) => ({ user: state.user, token: state.token }),

      migrate: (persisted, version) => {
        const state = persisted as { user?: User | null; token?: string | null };
        if (version < 2 && state?.user) {
          const mapped = LEGACY_ROLES[state.user.role as string];
          if (mapped) state.user = { ...state.user, role: mapped };
        }
        return state;
      },

      // Route guards must not run before this fires, otherwise a signed in
      // user is redirected to the login page on every hard refresh.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.syncUser();
      },
    }
  )
);

// Role helpers. One administrator role covers the whole admin area, so there
// is nothing finer to test for than these two.
export const isAdmin = (user: User | null) => user?.role === 'admin';

export const isReviewer = (user: User | null) =>
  user?.role === 'admin' || user?.role === 'reviewer';
