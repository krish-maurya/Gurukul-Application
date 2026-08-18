import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('gurukul_token');
    } catch {
      return null;
    }
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T = unknown>(path: string): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
      const headers = await this.authHeaders();
      const res = await fetch(`${this.baseUrl}${path}`, { method: 'GET', headers });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { data: null, error: (data as any)?.error || 'Request failed', status: res.status };
      return { data: data as T, error: null, status: res.status };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Network error', status: 0 };
    }
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
      const headers = await this.authHeaders();
      const res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { data: null, error: (data as any)?.error || 'Request failed', status: res.status };
      return { data: data as T, error: null, status: res.status };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Network error', status: 0 };
    }
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
      const headers = await this.authHeaders();
      const res = await fetch(`${this.baseUrl}${path}`, { method: 'PUT', headers, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { data: null, error: (data as any)?.error || 'Request failed', status: res.status };
      return { data: data as T, error: null, status: res.status };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Network error', status: 0 };
    }
  }

  async del<T = unknown>(path: string): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
      const headers = await this.authHeaders();
      const res = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE', headers });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { data: null, error: (data as any)?.error || 'Request failed', status: res.status };
      return { data: data as T, error: null, status: res.status };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Network error', status: 0 };
    }
  }

  setToken(token: string) {
    SecureStore.setItemAsync('gurukul_token', token);
  }

  clearToken() {
    SecureStore.deleteItemAsync('gurukul_token');
  }
}

export const api = new ApiClient(BASE_URL);
export default api;
