import type { AuditEvent } from '../types';
import { apiRequest } from './apiClient';

export interface AuditResponse {
  scope: 'all' | 'own';
  events: AuditEvent[];
}

export const auditService = {
  /** GET /api/audit — el administrador ve todo; el resto solo sus propios eventos. */
  list(): Promise<AuditResponse> {
    return apiRequest<AuditResponse>('GET', '/api/audit');
  }
};
