'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Search, Shield, UserPlus, Pencil, KeyRound, MailCheck, Trash2,
  UserCheck, UserX, X, ChevronLeft, ChevronRight, Loader2, Send, MoreHorizontal,
} from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Paginated, User, UserRole } from '@/types';
import { formatDate, getRoleLabel, getInitials, getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';

const ROLES: UserRole[] = ['user', 'reviewer', 'journal_admin', 'conference_admin', 'super_admin'];

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-gold-100 text-gold-700',
  journal_admin: 'bg-navy-100 text-navy-700',
  conference_admin: 'bg-purple-100 text-purple-700',
  reviewer: 'bg-green-100 text-green-700',
  user: 'bg-gray-100 text-gray-600',
};

const PAGE_SIZE = 25;

const emptyDraft = {
  email: '', full_name: '', password: '', role: 'user' as UserRole,
  institution: '', phone: '',
};

export default function AdminUsersPage() {
  const { user: me } = useAuthStore();

  const [page, setPage] = useState<Paginated<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [pageNo, setPageNo] = useState(1);

  // One row's action menu is open at a time. Editing and creating both use the
  // same modal, distinguished by whether a user is being edited.
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.adminList({
        page: pageNo,
        size: PAGE_SIZE,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });
      setPage(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [pageNo, search, roleFilter]);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => { setPageNo(1); }, [search, roleFilter]);

  // Any click outside a menu closes it.
  useEffect(() => {
    if (menuFor === null) return;
    const close = () => setMenuFor(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuFor]);

  const act = async (id: number, fn: () => Promise<unknown>, ok: string) => {
    setBusyId(id);
    setMenuFor(null);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const updateRole = (u: User, role: UserRole) =>
    act(u.id, () => usersApi.adminUpdate(u.id, { role }), `${u.full_name} is now ${getRoleLabel(role)}`);

  const toggleActive = (u: User) =>
    act(u.id, () => usersApi.adminUpdate(u.id, { is_active: !u.is_active }),
      u.is_active ? 'Account deactivated' : 'Account activated');

  const verify = (u: User) =>
    act(u.id, () => usersApi.adminUpdate(u.id, { is_verified: true }), 'Marked as verified');

  const sendReset = (u: User) =>
    act(u.id, () => usersApi.adminSendReset(u.id), `Reset link sent to ${u.email}`);

  const setPassword = (u: User) => {
    const pw = window.prompt(`Set a new password for ${u.full_name} (at least 8 characters)`);
    if (!pw) return;
    if (pw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    act(u.id, () => usersApi.adminSetPassword(u.id, pw), 'Password updated');
  };

  const remove = (u: User) => {
    if (!window.confirm(
      `Delete ${u.full_name} (${u.email})?\n\nThis cannot be undone. If they have papers or reviews, deactivate the account instead.`,
    )) return;
    act(u.id, () => usersApi.adminDelete(u.id), `${u.email} deleted`);
  };

  const openCreate = () => { setDraft(emptyDraft); setEditing(null); setCreating(true); };
  const openEdit = (u: User) => {
    setDraft({
      email: u.email, full_name: u.full_name, password: '',
      role: u.role, institution: u.institution || '', phone: u.phone || '',
    });
    setEditing(u);
    setCreating(false);
    setMenuFor(null);
  };
  const closeModal = () => { setEditing(null); setCreating(false); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await usersApi.adminUpdate(editing.id, {
          email: draft.email.trim(),
          full_name: draft.full_name.trim(),
          role: draft.role,
          institution: draft.institution || undefined,
          phone: draft.phone || undefined,
        });
        toast.success('User updated');
      } else {
        await usersApi.adminCreate({
          email: draft.email.trim(),
          full_name: draft.full_name.trim(),
          password: draft.password,
          role: draft.role,
          institution: draft.institution || undefined,
          phone: draft.phone || undefined,
        });
        toast.success('Account created');
      }
      closeModal();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const users = page?.items || [];
  const total = page?.total ?? 0;
  const pages = page?.pages ?? 1;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Administration</p>
          <h1 className="font-serif text-3xl text-navy-900 mb-1">Users</h1>
          <p className="text-navy-500 text-sm font-sans">
            Create accounts, assign roles and manage access.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <UserPlus className="w-4 h-4" /> New user
        </button>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[16rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            id="user-search"
            aria-label="Search users"
            type="search"
            placeholder="Search by name, email or institution"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>
        <div>
          <select
            id="role-filter"
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            className="input-base"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead className="bg-parchment-50 border-b border-parchment-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Institution</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-parchment-200 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-parchment-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-800 text-parchment-50 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                          : getInitials(user.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900 flex items-center gap-1.5">
                          {user.full_name}
                          {user.id === me?.id && (
                            <span className="badge bg-gold-100 text-gold-700 text-[10px]">You</span>
                          )}
                        </p>
                        <p className="text-xs text-navy-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-navy-600 max-w-[150px] truncate">
                    {user.institution || '-'}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      aria-label={`Role for ${user.full_name}`}
                      value={user.role}
                      disabled={busyId === user.id}
                      onChange={(e) => updateRole(user, e.target.value as UserRole)}
                      className={`badge cursor-pointer border-0 appearance-none disabled:opacity-50 ${roleColors[user.role]}`}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`badge ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {!user.is_verified && (
                        <span className="badge bg-amber-100 text-amber-700">Unverified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-navy-400 whitespace-nowrap">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {busyId === user.id && <Loader2 className="w-4 h-4 animate-spin text-navy-400" />}

                      <button
                        onClick={() => openEdit(user)}
                        title="Edit details"
                        aria-label={`Edit ${user.full_name}`}
                        className="p-2 rounded-lg text-navy-500 hover:bg-navy-50 hover:text-navy-800 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleActive(user)}
                        disabled={user.id === me?.id}
                        title={user.is_active ? 'Deactivate account' : 'Activate account'}
                        aria-label={`${user.is_active ? 'Deactivate' : 'Activate'} ${user.full_name}`}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          user.is_active
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      {/* Overflow menu keeps the rarer, riskier actions one step away. */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === user.id ? null : user.id); }}
                          title="More actions"
                          aria-label={`More actions for ${user.full_name}`}
                          aria-haspopup="menu"
                          aria-expanded={menuFor === user.id}
                          className="p-2 rounded-lg text-navy-500 hover:bg-navy-50 hover:text-navy-800 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {menuFor === user.id && (
                          <div
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-parchment-300 bg-white shadow-lg py-1"
                          >
                            <button role="menuitem" onClick={() => sendReset(user)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy-700 hover:bg-parchment-50 transition-colors">
                              <Send className="w-4 h-4 text-navy-400" /> Email password reset
                            </button>
                            <button role="menuitem" onClick={() => setPassword(user)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy-700 hover:bg-parchment-50 transition-colors">
                              <KeyRound className="w-4 h-4 text-navy-400" /> Set password
                            </button>
                            {!user.is_verified && (
                              <button role="menuitem" onClick={() => verify(user)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy-700 hover:bg-parchment-50 transition-colors">
                                <MailCheck className="w-4 h-4 text-navy-400" /> Mark email verified
                              </button>
                            )}
                            <div className="my-1 border-t border-parchment-200" />
                            <button
                              role="menuitem"
                              onClick={() => remove(user)}
                              disabled={user.id === me?.id}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" /> Delete account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && users.length === 0 && (
          <div className="text-center py-12 text-navy-400">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No users match that search.
          </div>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4 mt-5">
          <p className="font-sans text-sm text-navy-500">
            Page {page?.page} of {pages} · {total} user{total === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPageNo((n) => Math.max(1, n - 1))}
              disabled={(page?.page ?? 1) <= 1}
              className="btn-outline py-1.5 px-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPageNo((n) => Math.min(pages, n + 1))}
              disabled={(page?.page ?? 1) >= pages}
              className="btn-outline py-1.5 px-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </nav>
      )}

      {(creating || editing) && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/60 flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={closeModal}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="font-serif text-xl text-navy-900">
                {editing ? `Edit ${editing.full_name}` : 'New user'}
              </h2>
              <button type="button" onClick={closeModal} aria-label="Close" className="p-2 -m-2 text-navy-400 hover:text-navy-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="u-name" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
                  Full name <span className="text-red-600">*</span>
                </label>
                <input id="u-name" required value={draft.full_name}
                  onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
                  className="input-base" />
              </div>

              <div>
                <label htmlFor="u-email" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
                  Email <span className="text-red-600">*</span>
                </label>
                <input id="u-email" type="email" required value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  className="input-base" />
              </div>

              {!editing && (
                <div>
                  <label htmlFor="u-password" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <input id="u-password" type="password" required minLength={8} value={draft.password}
                    onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                    className="input-base" />
                  <p className="text-xs text-navy-400 mt-1">
                    At least 8 characters. They are emailed a sign in link and can change it themselves.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="u-role" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Role</label>
                <select id="u-role" value={draft.role}
                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as UserRole }))}
                  className="input-base">
                  {ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="u-institution" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Institution</label>
                  <input id="u-institution" value={draft.institution}
                    onChange={(e) => setDraft((d) => ({ ...d, institution: e.target.value }))}
                    className="input-base" />
                </div>
                <div>
                  <label htmlFor="u-phone" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Phone</label>
                  <input id="u-phone" type="tel" value={draft.phone}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                    className="input-base" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving' : editing ? 'Save changes' : 'Create account'}
              </button>
              <button type="button" onClick={closeModal} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
