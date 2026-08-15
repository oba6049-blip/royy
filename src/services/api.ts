import { StudentResult } from '../types';

export interface DbStatus {
  connected: boolean;
  databaseName: string;
  uriProvided: boolean;
  activeDriver: string;
  cloudinaryConfigured?: boolean;
}

export const api = {
  // DB Health & Status
  async getDbStatus(): Promise<DbStatus> {
    try {
      const res = await fetch('/api/db/status');
      if (!res.ok) throw new Error('Failed to fetch DB status');
      return await res.json();
    } catch {
      return {
        connected: false,
        databaseName: 'royal_academy',
        uriProvided: false,
        activeDriver: 'Active Node.js Memory Database',
        cloudinaryConfigured: false,
      };
    }
  },

  // Cloudinary Upload Helper
  async uploadImage(image: string, folder = 'royal_academy'): Promise<string> {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, folder }),
      });
      if (!res.ok) return image;
      const data = await res.json();
      return data.url || image;
    } catch {
      return image;
    }
  },

  // Students
  async getStudents(): Promise<any[]> {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      return await res.json();
    } catch {
      return [];
    }
  },

  async getStudentById(id: string): Promise<StudentResult | null> {
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createStudent(studentData: any): Promise<boolean> {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      if (res.ok && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_portal_data_updated', { detail: studentData }));
      }
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateStudent(id: string, updateData: any): Promise<boolean> {
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (res.ok && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_portal_data_updated', { detail: { id, ...updateData } }));
      }
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteStudent(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_portal_data_updated', { detail: { deletedId: id } }));
      }
      return res.ok;
    } catch {
      return false;
    }
  },

  // Classes & Subjects
  async getClasses(): Promise<any[]> {
    try {
      const res = await fetch('/api/classes');
      if (!res.ok) throw new Error('Failed to fetch classes');
      return await res.json();
    } catch {
      return [];
    }
  },

  async addClass(classData: any): Promise<boolean> {
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteClass(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/classes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getSubjects(): Promise<any[]> {
    try {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      return await res.json();
    } catch {
      return [];
    }
  },

  async addSubject(subjectData: any): Promise<boolean> {
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectData),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteSubject(code: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/subjects/${encodeURIComponent(code)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Sessions & Terms
  async getSessions(): Promise<any[]> {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return await res.json();
    } catch {
      return [];
    }
  },

  async addSession(sessionData: any): Promise<boolean> {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateSession(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteSession(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getTerms(): Promise<any[]> {
    try {
      const res = await fetch('/api/terms');
      if (!res.ok) throw new Error('Failed to fetch terms');
      return await res.json();
    } catch {
      return [];
    }
  },

  async addTerm(termData: any): Promise<boolean> {
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateTerm(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`/api/terms/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteTerm(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/terms/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Branding
  async getBranding(): Promise<any> {
    try {
      const res = await fetch('/api/branding');
      if (!res.ok) throw new Error('Failed to fetch branding');
      return await res.json();
    } catch {
      return { logoUrl: null, stampUrl: null, signatureUrl: null };
    }
  },

  async updateBranding(type: 'logoUrl' | 'stampUrl' | 'signatureUrl', url: string): Promise<{ success: boolean; url?: string; branding?: any }> {
    try {
      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, url }),
      });
      if (!res.ok) return { success: false };
      const data = await res.json();
      return { success: true, url: data.url, branding: data.branding };
    } catch {
      return { success: false };
    }
  },

  async saveBrandingPositions(positions: Record<string, { x: number; y: number; scale: number; rotate: number }>): Promise<{ success: boolean; branding?: any }> {
    try {
      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      });
      if (!res.ok) return { success: false };
      const data = await res.json();
      return { success: true, branding: data.branding };
    } catch {
      return { success: false };
    }
  },

  async savePrincipalRemark(principalRemark: string): Promise<{ success: boolean; branding?: any }> {
    try {
      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principalRemark }),
      });
      if (!res.ok) return { success: false };
      const data = await res.json();
      return { success: true, branding: data.branding };
    } catch {
      return { success: false };
    }
  },

  // Auth
  async loginAdmin(email: string, pass: string): Promise<any> {
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.admin;
    } catch {
      return null;
    }
  },

  async changePasswordFirstLogin(email: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string; admin?: any }> {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update password.' };
      }
      return { success: true, message: data.message, admin: data.admin };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error occurred.' };
    }
  },

  async getAdmins(): Promise<any[]> {
    try {
      const res = await fetch('/api/admins');
      if (!res.ok) throw new Error('Failed to fetch admins');
      return await res.json();
    } catch {
      return [];
    }
  },

  async createAdmin(adminData: any): Promise<{ success: boolean; message?: string; error?: string; admin?: any }> {
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to create staff account.' };
      }
      return { success: true, message: data.message, admin: data.admin };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error.' };
    }
  },

  async updateAdmin(id: string, updateData: any): Promise<{ success: boolean; admin?: any }> {
    try {
      const res = await fetch(`/api/admins/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) return { success: false };
      const data = await res.json();
      return { success: true, admin: data.admin };
    } catch {
      return { success: false };
    }
  },

  async resetAdminPassword(id: string, temporaryPassword?: string): Promise<{ success: boolean; message?: string; admin?: any }> {
    try {
      const res = await fetch(`/api/admins/${encodeURIComponent(id)}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temporaryPassword }),
      });
      if (!res.ok) return { success: false };
      const data = await res.json();
      return { success: true, message: data.message, admin: data.admin };
    } catch {
      return { success: false };
    }
  },

  async deleteAdmin(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admins/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Notifications & Announcements
  async getNotifications(): Promise<any[]> {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return await res.json();
    } catch {
      return [
        {
          id: 'notif-1',
          headline: 'Official Notice: Results for the 2024/2025 Academic Session are now available for checking!',
          message: 'All students, parents, and guardians can now check, verify, and print official continuous assessment & examination report slips using their 7-digit Registration ID.',
          tag: '2024/2025 Result Release',
          category: 'results',
          urgency: 'high',
          academicSession: '2024/2025',
          term: 'Third Term',
          linkText: 'Check Result Now',
          targetAction: 'check_result',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
  },

  async createNotification(notifData: any): Promise<{ success: boolean; notification?: any }> {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifData),
      });
      if (!res.ok) return { success: false };
      const data = await res.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_portal_notifications_updated', { detail: data.notification }));
      }
      return { success: true, notification: data.notification };
    } catch {
      return { success: false };
    }
  },

  async updateNotification(id: string, updateData: any): Promise<{ success: boolean; notification?: any }> {
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) return { success: false };
      const data = await res.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_portal_notifications_updated', { detail: { id, ...updateData } }));
      }
      return { success: true, notification: data.notification };
    } catch {
      return { success: false };
    }
  },

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_portal_notifications_updated', { detail: { deletedId: id } }));
      }
      return res.ok;
    } catch {
      return false;
    }
  }
};
