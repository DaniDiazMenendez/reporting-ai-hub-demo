import { Fragment, type ReactNode } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';

export interface FlowNode {
  label: string;
  detail?: string;
  icon?: ReactNode;
  highlight?: boolean;
}

/** Diagrama de flujo horizontal (vertical en móviles). `variant` diferencia arquitectura actual e ideal. */
export function FlowDiagram({
  nodes,
  variant = 'current',
  ariaLabel
}: {
  nodes: FlowNode[];
  variant?: 'current' | 'ideal';
  ariaLabel: string;
}) {
  return (
    <ol className={`flow flow-${variant}`} aria-label={ariaLabel}>
      {nodes.map((node, i) => (
        <Fragment key={`${node.label}-${i}`}>
          <li className={`flow-node ${node.highlight ? 'flow-node-highlight' : ''}`}>
            {node.icon && <span className="flow-icon" aria-hidden>{node.icon}</span>}
            <span className="flow-label">{node.label}</span>
            {node.detail && <span className="flow-detail">{node.detail}</span>}
          </li>
          {i < nodes.length - 1 && (
            <li className="flow-arrow" aria-hidden>
              <ArrowRight className="arrow-h" size={18} />
              <ArrowDown className="arrow-v" size={18} />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  );
}
