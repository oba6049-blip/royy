import { StudentResult } from '../types';

export interface DbStatus {
  connected: boolean;
  databaseName: string;
  uriProvided: boolean;
  activeDriver: string;
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
      };
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

  async updateBranding(type: 'logoUrl' | 'stampUrl' | 'signatureUrl', url: string): Promise<boolean> {
    try {
      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, url }),
      });
      return res.ok;
    } catch {
      return false;
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
  }
};
