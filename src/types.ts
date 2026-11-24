export type HubRole = 'EXECUTIVE' | 'FINANCE' | 'OPERATIONS' | 'COMMERCIAL' | 'ADMIN';

export type DataDomain = 'executive' | 'commercial' | 'finance' | 'operations' | 'production';

export type AccessLevel = 'Interno' | 'Restringido' | 'Confidencial';

/** Sesión propia del Hub. No es un token de Microsoft Entra ID. */
export interface HubSession {
  sessionId: string;
  userId: string;
  displayName: string;
  role: HubRole;
  allowedDomains: DataDomain[];
  allowedReportIds: string[];
  expiresAt: string;
}

export interface HubUser {
  userId: string;
  displayName: string;
  area: string;
  role: HubRole;
  allowedDomains: DataDomain[];
  allowedReportIds: string[];
  active: boolean;
}

export interface Report {
  id: string;
  name: string;
  description: string;
  domain: DataDomain;
  owner: string;
  dataSource: string;
  lastUpdated: string;
  accessLevel: AccessLevel;
}

export interface DataAgentConfig {
  id: string;
  name: string;
  domain: DataDomain;
  sources: ChatSource[];
  description: string;
}

export interface ChatSource {
  name: string;
  type: string;
}

export interface ReportContext {
  reportId: string;
  domain: DataDomain;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  sessionId: string;
  reportContext?: ReportContext;
  /** Campos extra que un navegador manipulado podría intentar enviar (rol, agente, etc.). */
  [extra: string]: unknown;
}

export interface TraceStep {
  step: string;
  status: 'ok' | 'fail' | 'skip';
  detail: string;
}

export interface ChatResponse {
  answer: string;
  conversationId: string;
  agent: string;
  dataAgent: string;
  domain: DataDomain;
  authorization: {
    authorized: true;
    authorizationSource: 'Hub application role';
    role: HubRole;
  };
  sources: ChatSource[];
  relatedReport: { id: string; name: string } | null;
  timestamp: string;
  accessLevelApplied: string;
  trace?: TraceStep[];
}

export type ApiErrorCode =
  | 'FORBIDDEN_DOMAIN'
  | 'FORBIDDEN_REPORT'
  | 'FORBIDDEN'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMITED'
  | 'CLIENT_OVERRIDE_REJECTED'
  | 'PROMPT_POLICY'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'NOT_FOUND'
  | 'BAD_REQUEST';

export interface ApiErrorBody {
  error: ApiErrorCode;
  message: string;
  requiredRoles?: HubRole[];
  trace?: TraceStep[];
}

export type AuthorizationResult = 'AUTHORIZED' | 'DENIED' | 'NOT_EVALUATED';

export interface AuditEvent {
  id: string;
  eventType: 'chat' | 'session' | 'report' | 'admin';
  userId: string;
  sessionId: string;
  role: HubRole | 'UNKNOWN';
  timestamp: string;
  question?: string;
  requestedDomain?: DataDomain | null;
  selectedAgent?: string | null;
  authorizationResult: AuthorizationResult;
  relatedReport?: string | null;
  responseStatus: number;
  detail?: string;
}

export interface PermissionsView {
  role: HubRole;
  roleLabel: string;
  allowedDomains: DataDomain[];
  deniedDomains: DataDomain[];
  allowedReportIds: string[];
  availableDataAgents: DataAgentConfig[];
  unavailableDataAgents: DataAgentConfig[];
  queriesPerHour: number;
  queriesUsedLastHour: number;
  adminAccess: boolean;
}

export interface ServiceStatus {
  aiService: 'operational' | 'unavailable';
  lastCheck: string;
}

export interface DomainAgentMapping {
  domain: DataDomain;
  agentId: string;
}
