'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Loader2, Save, PenTool, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { usersApi, authApi, certificatesApi } from '@/lib/api';
import { getInitials, getErrorMessage } from '@/lib/utils';
import { CertificateSignatory } from '@/types';
import toast from 'react-hot-toast';

function SignatureCard() {
  const [rows, setRows] = useState<CertificateSignatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    certificatesApi.mySignatories()
      .then(r => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !file) { toast.error('Provide your name and a signature image'); return; }
    setSubmitting(true);
    try {
      await certificatesApi.createMySignatory(name.trim(), title.trim(), file);
      toast.success('Signature submitted for admin review');
      setName(''); setTitle(''); setFile(null);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  };

  const onDelete = async (id: number) => {
    try {
      await certificatesApi.deleteMySignatory(id);
      setRows(rows.filter(r => r.id !== id));
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="card p-6 space-y-4 mb-6">
      <div>
        <h2 className="font-serif text-lg text-navy-900 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-gold-600" /> Certificate Signature
        </h2>
        <p className="text-sm text-navy-500 mt-1">
          Upload your signature so an administrator can use it on certificates you sign.
          It only appears on a certificate once approved and switched on from the admin
          certificates setup page.
        </p>
      </div>

      {!loading && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map(row => (
            <li key={row.id} className="flex items-center gap-3 p-3 rounded-lg bg-parchment-50 border border-parchment-200">
              {row.signature_url ? (
                <img src={row.signature_url} alt={row.name} className="h-10 object-contain" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-900 truncate">{row.name}</p>
                {row.title && <p className="text-xs text-navy-500 truncate">{row.title}</p>}
              </div>
              {row.is_active ? (
                <span className="badge bg-green-100 text-green-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="badge bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending review
                </span>
              )}
              <button
                type="button"
                onClick={() => onDelete(row.id)}
                aria-label={`Remove signature for ${row.name}`}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-parchment-200">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Name as it should appear</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chief Editor" className="input-base" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Signature image</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="input-base"
          />
          <p className="text-xs text-navy-400 mt-1">A scan or photo on a white background works best; the white is made transparent automatically.</p>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={submitting} className="btn-outline">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
            Submit Signature
          </button>
        </div>
      </form>
    </div>
  );
}

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

  const { register: regEmail, handleSubmit: handleEmail, reset: resetEmail, formState: { isSubmitting: emailSubmitting } } = useForm<{
    new_email: string; current_password: string;
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

  const onChangeEmail = async (data: { new_email: string; current_password: string }) => {
    try {
      const { data: updated } = await authApi.changeEmail(data);
      setUser(updated);
      toast.success('Email updated. Check your new inbox to verify it.');
      resetEmail();
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

      {/* Change email */}
      <form onSubmit={handleEmail(onChangeEmail)} className="card p-6 space-y-4 mb-6">
        <h2 className="font-serif text-lg text-navy-900">Change Email</h2>
        <p className="text-sm text-navy-500 -mt-2">
          Current: <span className="font-medium text-navy-700">{user.email}</span>. Takes effect
          immediately - you stay signed in, but you&apos;ll need to verify the new address.
        </p>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">New Email</label>
          <input {...regEmail('new_email')} type="email" className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">Current Password</label>
          <input {...regEmail('current_password')} type="password" className="input-base" />
        </div>
        <button type="submit" disabled={emailSubmitting} className="btn-outline">
          {emailSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Update Email
        </button>
      </form>

      {(user.role === 'chief_editor' || user.role === 'reviewer') && <SignatureCard />}

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
