'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Loader2, Save } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { usersApi, authApi } from '@/lib/api';
import { getInitials, getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [avatarLoading, setAvatarLoading] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      institution: user?.institution || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
    },
  });

  const { register: regPw, handleSubmit: handlePw, reset: resetPw, formState: { isSubmitting: pwSubmitting } } = useForm<{
    current_password: string; new_password: string; confirm: string;
  }>();

  const onSaveProfile = async (data: object) => {
    try {
      const { data: updated } = await usersApi.updateMe(data);
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const onChangePassword = async (data: { current_password: string; new_password: string; confirm: string }) => {
    if (data.new_password !== data.confirm) { toast.error("Passwords don't match"); return; }
    try {
      await authApi.changePassword({ current_password: data.current_password, new_password: data.new_password });
      toast.success('Password changed');
      resetPw();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const { data } = await usersApi.uploadAvatar(file);
      setUser(data);
      toast.success('Avatar updated');
    } catch { toast.error('Avatar upload failed'); }
    finally { setAvatarLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-navy-900 mb-8">My Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-navy-800 text-parchment-50 flex items-center justify-center text-2xl font-semibold overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              getInitials(user.full_name)
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-gold-400 transition-colors">
            {avatarLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-navy-900" /> : <Camera className="w-3.5 h-3.5 text-navy-900" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarLoading} />
          </label>
        </div>
        <div>
          <p className="font-serif text-xl text-navy-900">{user.full_name}</p>
          <p className="text-navy-500 text-sm">{user.email}</p>
          <span className="badge bg-navy-100 text-navy-700 mt-1">{user.role.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSaveProfile)} className="card p-6 space-y-4 mb-6">
        <h2 className="font-serif text-lg text-navy-900">Personal Information</h2>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Full Name</label>
          <input {...register('full_name')} className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Institution / Department</label>
          <input {...register('institution')} placeholder="e.g. Computer Science Department" className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Phone</label>
          <input {...register('phone')} placeholder="+234 xxx xxx xxxx" className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Bio / Research Interests</label>
          <textarea {...register('bio')} rows={3} placeholder="Brief description of your research interests..." className="input-base resize-none" />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handlePw(onChangePassword)} className="card p-6 space-y-4">
        <h2 className="font-serif text-lg text-navy-900">Change Password</h2>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Current Password</label>
          <input {...regPw('current_password')} type="password" className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">New Password</label>
          <input {...regPw('new_password')} type="password" placeholder="Min. 8 characters" className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Confirm New Password</label>
          <input {...regPw('confirm')} type="password" className="input-base" />
        </div>
        <button type="submit" disabled={pwSubmitting} className="btn-outline">
          {pwSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Update Password
        </button>
      </form>
    </div>
  );
}
