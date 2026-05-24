import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Building2,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { analyticsApi, dashboardApi, leadsApi } from '../services/api';
import { onSSEMessage } from '../services/sse';
import type { AnalyticsOverview, DashboardStats, Lead } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Subscribe to SSE updates
    const unsubscribe = onSSEMessage((data) => {
      if (data.type === 'new_lead' || data.type === 'message_received') {
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, analyticsRes, leadsRes] = await Promise.all([
        dashboardApi.getStats(),
        analyticsApi.getOverview(),
        leadsApi.getAll({ limit: 5, sortBy: 'lastInteractionAt', order: 'desc' }),
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setRecentLeads(leadsRes.data.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total de Leads',
      value: stats?.leads.total || 0,
      icon: Users,
      color: 'bg-primary-50 text-primary-600',
      trend: analytics?.leads.newThisMonth || 0,
      trendLabel: 'este mês',
    },
    {
      label: 'Leads Qualificados',
      value: stats?.leads.qualified || 0,
      icon: UserCheck,
      color: 'bg-success-50 text-success-600',
      trend: stats?.leads.total ? Math.round((stats.leads.qualified / stats.leads.total) * 100) : 0,
      trendLabel: 'taxa',
      isPercent: true,
    },
    {
      label: 'Prontos para Contato',
      value: stats?.leads.readyForContact || 0,
      icon: MessageSquare,
      color: 'bg-warning-50 text-warning-600',
      trend: null,
      trendLabel: '',
    },
    {
      label: 'Imóveis Ativos',
      value: stats?.properties || 0,
      icon: Building2,
      color: 'bg-slate-100 text-slate-600',
      trend: null,
      trendLabel: '',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visão geral da sua operação</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              {card.trend !== null && (
                <div className="flex items-center mt-3 text-sm">
                  {card.isPercent ? (
                    <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
                  )}
                  <span className="text-success-600 font-medium">{card.trend}</span>
                  <span className="text-slate-400 ml-1">{card.trendLabel}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads timeline chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Leads nos últimos 30 dias</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.timeline || []}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} leads`, 'Leads']}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    return d.toLocaleDateString('pt-BR');
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorLeads)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Taxa de Conversão</h3>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(analytics?.leads.conversionRate || 0) * 2.51} 251`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">
                  {analytics?.leads.conversionRate || 0}%
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">
              {analytics?.leads.qualified || 0} de {analytics?.leads.total || 0} leads qualificados
            </p>
          </div>
        </div>
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Leads Recentes</h3>
          <Link
            to="/leads"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentLeads.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum lead ainda</p>
            </div>
          ) : (
            recentLeads.map((lead) => (
              <Link
                key={lead._id}
                to={`/leads/${lead._id}`}
                className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-semibold text-sm">
                    {lead.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {lead.name || 'Lead sem nome'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lead.state.etapa === 'inicio' && 'Início'}
                    {lead.state.etapa === 'qualificacao' && 'Qualificação'}
                    {lead.state.etapa === 'apresentacao' && 'Apresentação'}
                    {lead.state.etapa === 'agendamento' && 'Agendamento'}
                    {lead.state.etapa === 'fechamento' && 'Fechamento'}
                    {' · '}
                    Score: {lead.score}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      lead.state.prontoParaCorretor
                        ? 'bg-success-50 text-success-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {lead.state.prontoParaCorretor ? 'Pronto' : 'Em qualificação'}
                  </span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
