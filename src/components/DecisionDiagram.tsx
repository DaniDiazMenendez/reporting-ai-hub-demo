import { HelpCircle } from 'lucide-react';

const NO_BRANCH = [
  'Usar sesión propia del Hub',
  'Validar rol en Azure Function',
  'Seleccionar agente por dominio',
  'Usar Managed Identity del backend',
  'Aplicar mínimo privilegio',
  'No existe seguridad individual en Fabric'
];

const YES_BRANCH = [
  'Usar arquitectura ideal',
  'Aplicar grupos de Entra ID',
  'Propagar identidad',
  'Usar permisos individuales',
  'Aplicar seguridad de Fabric y Power BI'
];

export function DecisionDiagram() {
  return (
    <div className="decision" role="group" aria-label="Diagrama de decisión de identidad">
      <div className="decision-question">
        <HelpCircle size={20} aria-hidden />
        ¿El usuario tiene identidad Entra ID?
      </div>
      <div className="decision-branches">
        <div className="decision-branch decision-no">
          <div className="decision-answer">No · Arquitectura actual</div>
          <ol>
            {NO_BRANCH.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        <div className="decision-branch decision-yes">
          <div className="decision-answer">Sí · Arquitectura ideal</div>
          <ol>
            {YES_BRANCH.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
