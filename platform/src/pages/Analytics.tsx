import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsApi } from '../services/api';
import type { AnalyticsOverview, FunnelStage, AgentPerformance } from '../types';
import { TrendingUp, Users, MessageSquare, Building2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [overviewRes, funnelRes, agentsRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getFunnel(),
        analyticsApi.getAgents(),
      ]);
      setOverview(overviewRes.data.data);
      setFunnel(funnelRes.data.data);
      setAgents(agentsRes.data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Métricas e performance da sua operação</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Leads',
            value: overview?.leads.total || 0,
            icon: Users,
            color: 'bg-primary-50 text-primary-600',
          },
          {
            label: 'Novos (30d)',
            value: overview?.leads.newThisMonth || 0,
            icon: TrendingUp,
            color: 'bg-success-50 text-success-600',
          },
          {
            label: 'Qualificados',
            value: overview?.leads.qualified || 0,
            icon: Users,
            color: 'bg-warning-50 text-warning-600',
          },
          {
            label: 'Imóveis Ativos',
            value: overview?.properties.active || 0,
            icon: Building2,
            color: 'bg-slate-100 text-slate-600',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Funil de Leads</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  dataKey="label"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Performance por Agente</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agents}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="totalLeads"
                  nameKey="label"
                >
                  {agents.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {agents.map((agent, index) => (
              <div key={agent.agent} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-slate-600">{agent.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent details table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Detalhes por Agente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Agente</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Leads</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Qualificados</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Prontos</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Score Médio</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Taxa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => (
                <tr key={agent.agent}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{agent.label}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{agent.totalLeads}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{agent.qualifiedCount}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{agent.readyCount}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{agent.avgScore}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                      {agent.qualificationRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
