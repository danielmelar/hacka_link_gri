import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Star,
  MessageSquare,
} from 'lucide-react';
import { leadsApi } from '../services/api';
import { onSSEMessage } from '../services/sse';
import type { Lead } from '../types';

const etapaLabels: Record<string, string> = {
  inicio: 'Início',
  qualificacao: 'Qualificação',
  apresentacao: 'Apresentação',
  agendamento: 'Agendamento',
  fechamento: 'Fechamento',
};

const etapaColors: Record<string, string> = {
  inicio: 'bg-slate-100 text-slate-600',
  qualificacao: 'bg-primary-50 text-primary-600',
  apresentacao: 'bg-warning-50 text-warning-600',
  agendamento: 'bg-success-50 text-success-600',
  fechamento: 'bg-primary-100 text-primary-700',
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    etapa: '',
    prontoParaCorretor: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLeads();
    const unsubscribe = onSSEMessage(() => loadLeads());
    return () => unsubscribe();
  }, [meta.page, filters]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: meta.page,
        limit: meta.limit,
        sortBy: 'lastInteractionAt',
        order: 'desc',
      };
      if (filters.etapa) params.etapa = filters.etapa;
      if (filters.prontoParaCorretor) params.prontoParaCorretor = filters.prontoParaCorretor;

      const res = await leadsApi.getAll(params);
      setLeads(res.data.data);
      setMeta(res.data.meta);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success-600';
    if (score >= 40) return 'text-warning-600';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 mt-1">Gerencie seus leads qualificados pela IA</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{meta.total} leads</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            showFilters
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 animate-fade-in">
          <select
            value={filters.etapa}
            onChange={(e) => setFilters({ ...filters, etapa: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas as etapas</option>
            <option value="inicio">Início</option>
            <option value="qualificacao">Qualificação</option>
            <option value="apresentacao">Apresentação</option>
            <option value="agendamento">Agendamento</option>
            <option value="fechamento">Fechamento</option>
          </select>
          <select
            value={filters.prontoParaCorretor}
            onChange={(e) => setFilters({ ...filters, prontoParaCorretor: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos os status</option>
            <option value="true">Pronto para corretor</option>
            <option value="false">Em qualificação</option>
          </select>
        </div>
      )}

      {/* Leads table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Etapa
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Agente
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Última interação
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-10 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-400">Nenhum lead encontrado</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link to={`/leads/${lead._id}`} className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-semibold text-sm">
                            {lead.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">
                            {lead.name || 'Lead sem nome'}
                          </p>
                          <p className="text-xs text-slate-500">{lead.phone || lead.email || '—'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          etapaColors[lead.state.etapa] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {etapaLabels[lead.state.etapa] || lead.state.etapa}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${getScoreColor(lead.score)}`} />
                        <span className={`text-sm font-semibold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {lead.state.agenteAtual === 'SDR_Geral' && 'Sofia'}
                        {lead.state.agenteAtual === 'Especialista_Familia' && 'Família'}
                        {lead.state.agenteAtual === 'Especialista_Alto_Padrao' && 'Alto Padrão'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(lead.lastInteractionAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.state.prontoParaCorretor ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-600">
                          <MessageSquare className="w-3 h-3" />
                          Pronto
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Qualificando
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total > meta.limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Página {meta.page} de {Math.ceil(meta.total / meta.limit)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                disabled={meta.page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                disabled={!meta.hasMore}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
