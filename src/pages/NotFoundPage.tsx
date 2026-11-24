import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui';

export function NotFoundPage() {
  return (
    <EmptyState
      title="Página no encontrada"
      description="La ruta solicitada no existe en el Hub."
      action={
        <Link className="btn btn-primary" to="/">
          <Compass size={16} aria-hidden /> Volver al inicio
        </Link>
      }
    />
  );
}