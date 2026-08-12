import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pj_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('pj_token');
      localStorage.removeItem('pj_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: object) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; new_password: string }) => api.post('/auth/reset-password', data),
  changePassword: (data: { current_password: string; new_password: string }) => api.post('/auth/change-password', data),
  verifyEmail: (token: string) => api.get(`/auth/verify?token=${token}`),
};

// Papers
export const papersApi = {
  submit: (data: FormData) => api.post('/papers/submit', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  myPapers: (status?: string) => api.get('/papers/my', { params: { status } }),
  get: (id: number) => api.get(`/papers/${id}`),
  adminAll: (params?: object) => api.get('/papers/admin/all', { params }),
  adminUpdate: (id: number, data: object) => api.patch(`/papers/${id}/admin`, data),
  resubmit: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/papers/${id}/resubmit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  publish: (id: number, file: File | null, meta?: { volume?: string; issue?: string; pages?: string; doi?: string }) => {
    const fd = new FormData();
    if (file) fd.append('file', file);
    Object.entries(meta || {}).forEach(([k, v]) => { if (v) fd.append(k, v); });
    return api.post(`/papers/${id}/publish`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  reviewQueue: () => api.get('/papers/review-queue'),
  replaceDocument: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/papers/${id}/final-document`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  myReviews: () => api.get('/papers/my-reviews'),
  getReviews: (paperId: number) => api.get(`/papers/${paperId}/reviews`),
  submitReview: (paperId: number, data: object) => api.post(`/papers/${paperId}/reviews`, data),
  shareReview: (paperId: number, reviewId: number) => api.patch(`/papers/${paperId}/reviews/${reviewId}/share`),
  // Chief editor dashboard
  editorReviewers: () => api.get('/papers/editor/reviewers'),
  editorStats: () => api.get('/papers/editor/stats'),
};

// Publications
export const publicationsApi = {
  list: (params?: object) => api.get('/publications', { params }),
  get: (slug: string) => api.get(`/publications/${slug}`),
  stats: () => api.get('/publications/stats'),
  recordDownload: (slug: string) => api.post(`/publications/${slug}/download`),
  adminAll: () => api.get('/publications/admin/all'),
  setVisibility: (id: number, isLive: boolean) =>
    api.patch(`/publications/${id}/visibility`, { is_live: isLive }),
};

// Conferences
export const conferencesApi = {
  list: () => api.get('/conferences'),
  get: (id: number) => api.get(`/conferences/${id}`),
  create: (data: object) => api.post('/conferences', data),
  update: (id: number, data: object) => api.patch(`/conferences/${id}`, data),
  // Open to anyone. The interceptor attaches a token when there is one, and the
  // backend links the registration to that account; without one it registers a
  // guest against the email address in the form.
  register: (id: number, data: object) => api.post(`/conferences/${id}/register`, data),
  updateRegistration: (regId: number, data: object) =>
    api.patch(`/conferences/registrations/${regId}`, data),
  myRegistration: (id: number) => api.get(`/conferences/${id}/my-registration`),
  myRegistrations: () => api.get('/conferences/my-registrations'),
  registrations: (id: number) => api.get(`/conferences/${id}/registrations`),
  uploadProceedings: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/conferences/${id}/proceedings`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Users
export const systemApi = {
  health: () => api.get('/system/health'),
};

export const certificatesApi = {
  preview: (conferenceId?: number) =>
    api.get('/certificates/preview', { params: { conference_id: conferenceId } }),
  list: (conferenceId?: number) =>
    api.get('/certificates', { params: { conference_id: conferenceId } }),
  generate: (conferenceId: number | undefined, kinds: string[]) =>
    api.post('/certificates/generate', { conference_id: conferenceId, kinds }),
  approve: (certificateIds: number[]) =>
    api.post('/certificates/approve', { certificate_ids: certificateIds }),
  mine: () => api.get('/certificates/mine'),

  // Template and signatory management
  templates: () => api.get('/certificates/templates'),
  uploadTemplate: (kind: string, file: File | null, bandY?: number) => {
    const fd = new FormData();
    if (file) fd.append('file', file);
    if (bandY !== undefined) fd.append('signatory_band_y', String(bandY));
    return api.post(`/certificates/templates/${kind}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  sampleUrl: (kind: string) => `${API_URL}/certificates/templates/${kind}/sample`,
  signatories: () => api.get('/certificates/signatories'),
  createSignatory: (data: object) => api.post('/certificates/signatories', data),
  updateSignatory: (id: number, data: object) => api.patch(`/certificates/signatories/${id}`, data),
  uploadSignature: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/certificates/signatories/${id}/signature`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteSignatory: (id: number) => api.delete(`/certificates/signatories/${id}`),

  // Self-service: a chief editor or reviewer uploads their own signature.
  mySignatories: () => api.get('/certificates/signatories/mine'),
  createMySignatory: (name: string, title: string, file: File) => {
    const fd = new FormData();
    fd.append('name', name);
    if (title) fd.append('title', title);
    fd.append('file', file);
    return api.post('/certificates/signatories/mine', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteMySignatory: (id: number) => api.delete(`/certificates/signatories/mine/${id}`),
};

export const proceedingsApi = {
  list: (conferenceId?: number) => api.get('/proceedings', { params: { conference_id: conferenceId } }),
  get: (slug: string) => api.get(`/proceedings/${slug}`),
  recordDownload: (slug: string) => api.post(`/proceedings/${slug}/download`),
  adminAll: (conferenceId?: number) => api.get('/proceedings/admin/all', { params: { conference_id: conferenceId } }),
  create: (title: string, conferenceId: number, file: File) => {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('conference_id', String(conferenceId));
    fd.append('file', file);
    return api.post('/proceedings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  setVisibility: (id: number, isLive: boolean) => api.patch(`/proceedings/${id}/visibility`, { is_live: isLive }),
  remove: (id: number) => api.delete(`/proceedings/${id}`),
};

export const usersApi = {
  me: () => api.get('/users/me'),
  updateMe: (data: object) => api.patch('/users/me', data),
  uploadAvatar: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  notifications: (unreadOnly?: boolean) => api.get('/users/me/notifications', { params: { unread_only: unreadOnly } }),
  markAllRead: () => api.post('/users/me/notifications/read-all'),
  // Admin user management. Listing is paginated and filtered server side.
  adminList: (params?: {
    role?: string; search?: string; is_active?: boolean; page?: number; size?: number;
  }) => api.get('/users', { params }),
  adminGet: (id: number) => api.get(`/users/${id}`),
  adminCreate: (data: object) => api.post('/users', data),
  adminUpdate: (id: number, data: object) => api.patch(`/users/${id}`, data),
  adminDelete: (id: number) => api.delete(`/users/${id}`),
  adminSetPassword: (id: number, new_password: string) =>
    api.post(`/users/${id}/password`, { new_password }),
  adminSendReset: (id: number) => api.post(`/users/${id}/send-reset`),
};
