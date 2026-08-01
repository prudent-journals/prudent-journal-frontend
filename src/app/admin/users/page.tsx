'use client';

import { useEffect, useState } from 'react';
import { Search, Shield } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { User, UserRole } from '@/types';
import { formatDate, getRoleLabel, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const ROLES: UserRole[] = ['user', 'reviewer', 'journal_admin', 'conference_admin', 'super_admin'];

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-gold-100 text-gold-700',
  journal_admin: 'bg-navy-100 text-navy-700',
  conference_admin: 'bg-purple-100 text-purple-700',
  reviewer: 'bg-green-100 text-green-700',
  user: 'bg-gray-100 text-gray-600',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    usersApi.adminList().then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (userId: number, role: UserRole) => {
    try {
      await usersApi.adminUpdate(userId, { role });
      toast.success('Role updated');
      load();
    } catch { toast.error('Failed to update role'); }
  };

  const toggleActive = async (userId: number, isActive: boolean) => {
    try {
      await usersApi.adminUpdate(userId, { is_active: !isActive });
      toast.success(isActive ? 'User deactivated' : 'User activated');
      load();
    } catch { toast.error('Failed to update user'); }
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-navy-900 mb-1">Users</h1>
        <p className="text-navy-500 text-sm font-sans">Manage user accounts and role assignments.</p>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-parchment-50 border-b border-parchment-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Institution</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3" />
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
              ) : filtered.map(user => (
                <tr key={user.id} className="hover:bg-parchment-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-800 text-parchment-50 flex items-center justify-center text-xs font-semibold">
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                          : getInitials(user.full_name)
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy-900">{user.full_name}</p>
                        <p className="text-xs text-navy-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-navy-600 max-w-[150px] truncate">
                    {user.institution || ' - '}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={user.role}
                      onChange={e => updateRole(user.id, e.target.value as UserRole)}
                      className={`badge cursor-pointer border-0 appearance-none ${roleColors[user.role]}`}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`badge ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-navy-400 whitespace-nowrap">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleActive(user.id, user.is_active)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                        user.is_active
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-navy-400">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
