import type { Issue, User, Notification, Pagination } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {};
    // Don't set Content-Type for FormData — browser sets it with boundary
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config: RequestInit = {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  async register(userData: {
    name: string; email: string; password: string;
    phone?: string; role?: 'citizen' | 'official' | 'admin';
  }) {
    return this.request<{ success: boolean; message: string; data: { token: string; refreshToken: string; user: User } }>(
      '/auth/register', { method: 'POST', body: JSON.stringify(userData) }
    );
  }

  async login(email: string, password: string) {
    return this.request<{ success: boolean; message: string; data: { token: string; refreshToken: string; user: User } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    );
  }

  async sendOTP(email: string, name?: string) {
    return this.request<{ success: boolean; message: string }>(
      '/auth/send-otp', { method: 'POST', body: JSON.stringify({ email, name }) }
    );
  }

  async verifyOTP(email: string, otp: string) {
    return this.request<{ success: boolean; message: string }>(
      '/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }
    );
  }

  async googleLogin(credential: string) {
    return this.request<{ success: boolean; message: string; data: { token: string; refreshToken: string; user: User } }>(
      '/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }
    );
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  async getProfile() {
    return this.request<{ success: boolean; data: { user: User } }>('/auth/profile');
  }

  async updateProfile(formData: FormData) {
    return this.request<{ success: boolean; data: { user: User } }>(
      '/auth/profile', { method: 'PATCH', body: formData }
    );
  }

  // ── Issues ──────────────────────────────────────────────────────────────────

  async getIssues(params: {
    page?: number; limit?: number; status?: string;
    category?: string; severity?: string; search?: string;
    sortBy?: string; order?: string;
  } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
    return this.request<{ success: boolean; data: { issues: Issue[]; pagination: Pagination } }>(
      `/issues?${query}`
    );
  }

  async getMyIssues() {
    return this.request<{ success: boolean; data: { issues: Issue[] } }>('/issues/my-issues');
  }

  async getNearbyIssues(latitude: number, longitude: number, radius = 5000) {
    return this.request<{ success: boolean; data: { issues: Issue[] } }>(
      `/issues/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    );
  }

  async getIssue(id: string) {
    return this.request<{ success: boolean; data: { issue: Issue } }>(`/issues/${id}`);
  }

  async createIssue(formData: FormData) {
    return this.request<{ success: boolean; data: { issue: Issue } }>(
      '/issues', { method: 'POST', body: formData }
    );
  }

  async updateIssueStatus(id: string, status: string, adminRemarks?: string, assignedDepartment?: string) {
    return this.request<{ success: boolean; data: { issue: Issue } }>(
      `/issues/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminRemarks, assignedDepartment }),
      }
    );
  }

  async upvoteIssue(id: string) {
    return this.request<{ success: boolean; data: { upvotes: number } }>(
      `/issues/${id}/upvote`, { method: 'POST' }
    );
  }

  async verifyIssue(id: string, comment?: string) {
    return this.request<{ success: boolean; data: { verificationCount: number } }>(
      `/issues/${id}/verify`, { method: 'POST', body: JSON.stringify({ comment }) }
    );
  }

  async deleteIssue(id: string) {
    return this.request<{ success: boolean }>(`/issues/${id}`, { method: 'DELETE' });
  }

  // ── Notifications ───────────────────────────────────────────────────────────

  async getNotifications() {
    return this.request<{ success: boolean; data: { notifications: Notification[]; unreadCount: number } }>(
      '/notifications'
    );
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' });
  }

  // ── Leaderboard ─────────────────────────────────────────────────────────────

  async getLeaderboard(period: 'week' | 'month' | 'overall' = 'overall') {
    return this.request<{ success: boolean; data: { users: User[]; period: string } }>(
      `/leaderboard?period=${period}`
    );
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  async getAdminDashboard() {
    return this.request<{ success: boolean; data: { stats: Record<string, number> } }>(
      '/admin/dashboard'
    );
  }

  async getAdminIssues(params: { page?: number; status?: string; category?: string } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
    return this.request<{ success: boolean; data: { issues: Issue[]; pagination: Pagination } }>(
      `/admin/issues?${query}`
    );
  }

  async getAdminUsers(params: { page?: number; role?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
    return this.request<{ success: boolean; data: { users: User[]; pagination: Pagination } }>(
      `/admin/users?${query}`
    );
  }

  async getAnalytics() {
    return this.request<{ success: boolean; data: Record<string, unknown[]> }>('/admin/analytics');
  }

  // ── Health ──────────────────────────────────────────────────────────────────
  async healthCheck() {
    return this.request<{ success: boolean; message: string }>('/health');
  }

  // ── Image URL helper ────────────────────────────────────────────────────────
  /** Returns a usable src URL for an IssueImage regardless of storage backend */
  getImageUrl(img: { url?: string; filename?: string; path?: string } | undefined): string {
    if (!img) return '';
    if (img.url) return img.url; // Cloudinary
    if (img.filename) return `${this.baseURL}/issues/image/${img.filename}`; // legacy local
    return '';
  }
}

export const apiService = new ApiService();
export default apiService;
