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

if (typeof window !== 'undefined') {
  // pj_token and pj_auth live in localStorage, shared by every tab of this
  // origin - the request interceptor in api.ts reads pj_token fresh on every
  // call, so a sign-in (or sign-out) in one tab silently redirects every
  // other open tab's *requests* to the new session, even though each tab's
  // own in-memory Zustand state - and therefore everything it has rendered -
  // still reflects whoever was signed in before. Left alone, that is a
  // different person's name in the sidebar next to another person's papers,
  // reviews and notifications. Reloading re-derives this tab's state from
  // whichever session is actually live, and route guards then send it
  // wherever that session belongs.
  window.addEventListener('storage', (e) => {
    if (e.key !== 'pj_auth' || e.newValue === e.oldValue) return;
    window.location.reload();
  });
}

// Role helpers.
export const isAdmin = (user: User | null) => user?.role === 'admin';

// Admin can reach the chief editor's editorial surface too - it is a subset
// of what admin can already do, just with its own dashboard.
export const isChiefEditor = (user: User | null) =>
  user?.role === 'admin' || user?.role === 'chief_editor';

export const isReviewer = (user: User | null) =>
  user?.role === 'admin' || user?.role === 'reviewer';
