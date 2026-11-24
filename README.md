# Reporting & AI Hub — Demo

> **Demo 100 % local con datos simulados.** No se conecta a Azure, Microsoft Foundry, Fabric, Power BI ni a ningún servicio real. No contiene API keys, tokens, client secrets, URLs ni IDs reales.

## 1. Objetivo de la demo

Mostrar cómo incorporar un asistente de IA al Hub de reportería existente **sin rediseñar inmediatamente el acceso de los usuarios** (sin Microsoft Entra ID), manteniendo una postura de seguridad razonable: la Azure Function actúa como puerta de seguridad y selecciona agentes y dominios permitidos según los roles del Hub. Además, presentar la arquitectura ideal (Entra ID + identity passthrough) como evolución futura.

## 2. Situación actual

- Los usuarios ingresan a un Hub web con **sesión propia** (no Entra ID).
- El Hub publica reportes de Power BI a través de una Azure Function.
- No existe identidad individual hacia Fabric / Power BI: el acceso a datos ocurre con una identidad técnica.

## 3. Arquitectura actual

```
Usuario → Hub Web (sesión propia) → Azure Function → Power BI Embedded
```

## 4. Arquitectura actual adaptada con IA

```
Usuario → Hub Web → Azure Function (sesión + roles + allowlist + auditoría + rate limit)
        → Managed Identity → Microsoft Foundry (agente orquestador)
        → Fabric IQ / Data Agent del dominio permitido
```

- El navegador **nunca** llama a Foundry directamente.
- El rol **no** viaja desde el frontend: la Function lo reconstruye desde la sesión.
- El agente se elige en el backend a partir del dominio autorizado (allowlist).

## 5. Arquitectura ideal

```
Usuario (Entra ID) → Hub Web → Azure Function (token On-Behalf-Of)
        → Foundry → Data Agents → Fabric / Power BI con RLS/OLS por usuario
```

Entra ID se muestra **solo** en la pestaña "Arquitectura ideal"; el flujo de la demo no lo utiliza.

## 6. Diferencias entre ambos modelos

| Aspecto | Actual adaptada | Ideal |
|---|---|---|
| Identidad | Sesión propia del Hub | Microsoft Entra ID |
| Autorización | Roles del Hub validados en la Function | Grupos de Entra ID + permisos individuales |
| Acceso a datos | Managed Identity (técnica) | Identity passthrough (OBO) |
| Seguridad en Fabric | Por dominio / agente | RLS / OLS por usuario |
| Auditoría | Usuario del Hub registrado por la Function | Usuario real end-to-end |

## 7. Estrategia de permisos sin Entra ID

- Roles: `EXECUTIVE`, `FINANCE`, `OPERATIONS`, `COMMERCIAL`, `ADMIN`.
- Cada usuario tiene dominios y reportes permitidos (subconjunto del máximo de su rol).
- La Function valida dominio, reporte y agente en cada solicitud.
- Ocultar un botón en la UI **no** reemplaza la autorización del backend (ver Simulador → URL directa).

## 8. Rol de la Azure Function

Validar sesión y expiración, reconstruir permisos, detectar dominio de la pregunta, rechazar campos manipulados (`role`, `agentId`, `allowedDomains`), aplicar políticas de prompt, rate limiting, seleccionar el agente desde la allowlist dominio→agente, invocar Foundry y registrar auditoría.

## 9. Uso de Managed Identity

La Function usa una Managed Identity para Foundry y Fabric, sin secretos en código. Debe tener **mínimo privilegio**: solo los workspaces/agentes necesarios, idealmente una identidad por dominio.

## 10. Uso de Microsoft Foundry

Foundry aloja el agente orquestador y los agentes por dominio. Solo la Function lo invoca; el frontend nunca recibe endpoints ni credenciales.

## 11. Uso de Fabric IQ y Data Agents

Data Agents **separados por dominio** (Operaciones, Finanzas, Comercial, Producción), cada uno con acceso solo a los datos que ese dominio necesita.

## 12. Riesgos del uso de una identidad técnica

- Sin seguridad individual en Fabric: todo usuario autorizado a un dominio ve los mismos datos de ese dominio.
- Una identidad con acceso global amplificaría cualquier error de autorización.
- Los prompts no son un mecanismo de seguridad.

## 13. Estrategia de mínimo privilegio

Separar identidades/agentes por dominio, limitar roles en Fabric a lectura, allowlist explícita en la Function, expiración de sesión, rate limiting y auditoría centralizada (Application Insights).

## 14. Cómo ejecutar localmente

Requisitos: Node.js 18+.

```powershell
npm install
npm run dev      # servidor de desarrollo (Vite)
npm run build    # typecheck + build de producción en dist/
npm run preview  # sirve el build
```

Usuarios demo (seleccionables en el login): Andrea Rojas (EXECUTIVE), Martín Fuentes (FINANCE), Usuario Demo (OPERATIONS), Valentina Soto (COMMERCIAL), Administrador Hub (ADMIN), Jorge Paredes (OPERATIONS, solo Producción).

## 15. Estructura del proyecto

```
src/
  backend/     Azure Function simulada (mockServer, auth, processChatRequest, domainDetection, state)
  services/    Clientes del frontend (apiClient, session, chat, reports, permissions, audit)
  mocks/       Usuarios, reportes, permisos, respuestas del chat, auditoría
  context/     SessionContext, ChatContext
  components/  Layout, ChatWindow, FlowDiagram, DecisionDiagram, ReportCard, ui
  hooks/       useApi
  pages/       Login, Inicio, Reportes, Visor, Asistente, Arquitecturas, Seguridad, Simulador, Administración
  styles/      global.css
```

## 16. Endpoints simulados

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/session/login` | Inicia sesión (solo envía `userId`) |
| POST | `/api/session/logout` | Cierra sesión |
| GET | `/api/session` | Sesión actual y permisos reconstruidos |
| GET | `/api/session/demo-users` | Usuarios demo |
| GET | `/api/status` | Estado del servicio de IA |
| GET | `/api/reports` | Reportes permitidos |
| GET | `/api/reports/:id` | Reporte (403 si no está permitido) |
| GET | `/api/permissions` | Dominios y agentes permitidos |
| POST | `/api/chat` | Pregunta al asistente |
| GET | `/api/audit` | Eventos de auditoría |
| GET | `/api/admin/config` | Configuración (solo ADMIN) |
| PUT | `/api/admin/users/:id` | Actualiza permisos de usuario (solo ADMIN) |
| PUT | `/api/admin/domain-agents` | Mapeo dominio→agente (solo ADMIN) |

Códigos simulados: `401` sesión expirada, `403 FORBIDDEN_DOMAIN / FORBIDDEN_REPORT / FORBIDDEN`, `400 CLIENT_OVERRIDE_REJECTED / PROMPT_POLICY`, `429 RATE_LIMITED`, `503 AI_SERVICE_UNAVAILABLE`.

## 17. Variables futuras

Solo nombres (ver `.env.example`); esta demo no las utiliza:

- `VITE_API_BASE_URL`
- `HUB_SESSION_SECRET`
- `FOUNDRY_PROJECT_ENDPOINT`
- `FOUNDRY_AGENT_NAME`
- `FOUNDRY_OPERATIONS_AGENT_NAME`
- `FOUNDRY_FINANCE_AGENT_NAME`
- `FOUNDRY_COMMERCIAL_AGENT_NAME`
- `FOUNDRY_PRODUCTION_AGENT_NAME`
- `APPLICATION_INSIGHTS_CONNECTION_STRING`

## 18. Consideraciones para producción

- Sesiones firmadas, HttpOnly/Secure, con expiración y rotación.
- Secretos en Azure Key Vault / App Settings; nunca en el repositorio.
- Managed Identity con mínimo privilegio y separada por dominio.
- Rate limiting distribuido (p. ej. API Management).
- Auditoría en Application Insights / Log Analytics con retención definida.
- Evaluación de contenido y protección contra prompt injection en Foundry.
- Para información sensible y permisos individuales, migrar a Microsoft Entra ID con identity passthrough y RLS/OLS en Fabric / Power BI.
