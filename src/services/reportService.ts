import type { Report } from '../types';
import { apiRequest } from './apiClient';

export interface ReportListResponse {
  reports: Report[];
  hiddenCount: number;
}

export const reportService = {
  /** GET /api/reports — el backend devuelve solo los reportes autorizados para la sesión. */
  list(): Promise<ReportListResponse> {
    return apiRequest<ReportListResponse>('GET', '/api/reports');
  },

  /** GET /api/reports/:id — valida autorización aunque el usuario llegue por URL directa. */
  get(reportId: string): Promise<Report> {
    return apiRequest<Report>('GET', `/api/reports/${encodeURIComponent(reportId)}`);
  }
};

const FAVORITES_KEY = 'hub.favorites';

/** Favoritos: preferencia de interfaz, no es un mecanismo de seguridad. */
export const favoritesStore = {
  get(userId: string): string[] {
    try {
      return JSON.parse(localStorage.getItem(`${FAVORITES_KEY}.${userId}`) ?? '[]') as string[];
    } catch {
      return [];
    }
  },
  set(userId: string, ids: string[]) {
    localStorage.setItem(`${FAVORITES_KEY}.${userId}`, JSON.stringify(ids));
  }
};
