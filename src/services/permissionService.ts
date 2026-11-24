import type { DataAgentConfig, DataDomain, HubRole, HubUser, PermissionsView, ServiceStatus } from '../types';
import type { RoleDefinition } from '../mocks/permissions';
import { apiRequest } from './apiClient';

export interface AdminConfig {
  users: HubUser[];
  roles: Array<RoleDefinition & { role: HubRole }>;
  domainAgents: Record<DataDomain, string>;
  agentAllowlist: DataAgentConfig[];
}

export const permissionService = {
  /** GET /api/permissions — permisos efectivos reconstruidos por el backend desde la sesión. */
  getPermissions(): Promise<PermissionsView> {
    return apiRequest<PermissionsView>('GET', '/api/permissions');
  },

  getServiceStatus(): Promise<ServiceStatus> {
    return apiRequest<ServiceStatus>('GET', '/api/status', undefined, 200);
  },

  getAdminConfig(): Promise<AdminConfig> {
    return apiRequest<AdminConfig>('GET', '/api/admin/config');
  },

  updateUser(userId: string, changes: Partial<Pick<HubUser, 'role' | 'allowedDomains' | 'allowedReportIds'>>): Promise<HubUser> {
    return apiRequest<HubUser>('PUT', `/api/admin/users/${encodeURIComponent(userId)}`, changes);
  },

  updateDomainAgent(domain: DataDomain, agentId: string): Promise<Record<DataDomain, string>> {
    return apiRequest<Record<DataDomain, string>>('PUT', '/api/admin/domain-agents', { domain, agentId });
  }
};
