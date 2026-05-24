import { useEffect, useState } from 'react';
import { Bot, MessageSquare, Users, Star, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { analyticsApi } from '../services/api';
import type { AgentPerformance } from '../types';

const agentConfig = [
  {
    key: 'SDR_Geral',
    name: 'Sofia',
    role: 'SDR de Qualificação',
    description: 'Agente inicial que qualifica leads, extrai informações e direciona para especialistas.',
    color: 'bg-primary-50 border-primary-200',
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-100',
  },
  {
    key: 'Especialista_Familia',
    name: 'Especialista Família',
    role: 'Consultor Familiar',
    description: 'Especialista em imóveis para famílias. Foca em segurança, escolas, áreas de lazer e espaços amplos.',
    color: 'bg-success-50 border-success-200',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100',
  },
  {
    key: 'Especialista_Alto_Padrao',
    name: 'Especialista Alto Padrão',
    role: 'Consultor de Luxo',
    description: 'Especialista em imóveis de alto padrão. Foca em exclusividade, acabamento premium e localização privilegiada.',
    color: 'bg-warning-50 border-warning-200',
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-100',
  },
];

export default function Agents() {
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      const res = await analyticsApi.getAgents();
      setPerformance(res.data.data);
    } catch (error) {
      console.error('Error loading agent performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformance = (agentKey: string) => {
    return performance.find((p) => p.agent === agentKey);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agentes de IA</h1>
        <p className="text-slate-500 mt-1">Gerencie seus agentes inteligentes de qualificação</p>
      </div>

      {/* Agents grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {agentConfig.map((agent) => {
          const perf = getPerformance(agent.key);
          return (
            <div
              key={agent.key}
              className={`rounded-xl border p-6 ${agent.color}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${agent.iconBg} flex items-center justify-center`}>
                    <Bot className={`w-6 h-6 ${agent.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                    <p className="text-xs text-slate-500">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-success-600 bg-success-50 px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 mt-4">{agent.description}</p>

              {/* Stats */}
              {perf && (
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200/50">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{perf.totalLeads}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Leads atendidos
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{perf.qualificationRate}%</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Taxa de qualificação
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{perf.avgScore}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Score médio
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{perf.readyCount}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Prontos para corretor
                    </p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200/50">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <div className="h-8 bg-slate-200/50 rounded animate-pulse" />
                      <div className="h-3 bg-slate-200/50 rounded animate-pulse mt-2 w-2/3" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Como funciona a triagem</h3>
        <div className="flex items-center gap-4">
          {[
            { step: 1, label: 'Lead entra', desc: 'Via Telegram' },
            { step: 2, label: 'Sofia qualifica', desc: 'Extrai perfil' },
            { step: 3, label: 'Direcionamento', desc: 'Especialista ideal' },
            { step: 4, label: 'Portfólio', desc: 'Imóveis sugeridos' },
            { step: 5, label: 'Corretor', desc: 'Lead pronto' },
          ].map((item, index) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
                  <span className="text-primary-700 font-bold text-sm">{item.step}</span>
                </div>
                <p className="text-xs font-medium text-slate-700 mt-1">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              {index < 4 && (
                <div className="w-8 h-px bg-slate-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
