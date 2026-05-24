import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-slate-500 mb-6">Página não encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
