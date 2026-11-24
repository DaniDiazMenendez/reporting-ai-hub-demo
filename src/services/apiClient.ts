import type { ApiErrorBody } from '../types';
import { handleRequest, type MockRequest } from '../backend/mockServer';

/**
 * Cliente HTTP de la demo. En producción haría fetch a `${import.meta.env.VITE_API_BASE_URL}/api/...`
 * enviando la cookie de sesión del Hub. Aquí enruta las llamadas al backend simulado.
 * El navegador nunca habla con Microsoft Foundry directamente.
 */
const SESSION_KEY = 'hub.sessionId';

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;
  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

export const sessionStore = {
  get: (): string | null => sessionStorage.getItem(SESSION_KEY),
  set: (id: string) => sessionStorage.setItem(SESSION_KEY, id),
  clear: () => sessionStorage.removeItem(SESSION_KEY)
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiRequest<T>(
  method: MockRequest['method'],
  path: string,
  body?: unknown,
  latencyMs = 250 + Math.random() * 350
): Promise<T> {
  await delay(latencyMs);
  const result = handleRequest({ method, path, body: body === undefined ? undefined : structuredClone(body), sessionId: sessionStore.get() });
  if (result.status >= 400) {
    throw new ApiError(result.status, result.body as ApiErrorBody);
  }
  return structuredClone(result.body) as T;
}
