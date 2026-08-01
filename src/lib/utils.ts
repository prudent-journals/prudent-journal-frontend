import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { PaperStatus, UserRole } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMMM d, yyyy');
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getStatusColor(status: PaperStatus): string {
  const map: Record<PaperStatus, string> = {
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-purple-100 text-purple-800',
    revision_requested: 'bg-orange-100 text-orange-800',
    resubmitted: 'bg-cyan-100 text-cyan-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    published: 'bg-emerald-100 text-emerald-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: PaperStatus): string {
  const map: Record<PaperStatus, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    reviewed: 'Reviewed',
    revision_requested: 'Revision Requested',
    resubmitted: 'Resubmitted',
    accepted: 'Accepted',
    rejected: 'Rejected',
    published: 'Published',
  };
  return map[status] || status;
}

export function getRoleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: 'Administrator',
    reviewer: 'Reviewer',
    user: 'Author',
  };
  return map[role] || role;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { detail?: string } } };
    return axiosError.response?.data?.detail || 'An error occurred';
  }
  return 'An unexpected error occurred';
}
