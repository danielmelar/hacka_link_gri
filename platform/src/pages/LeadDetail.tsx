import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Star,
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Home,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Send,
} from 'lucide-react';
import { leadsApi, followUpsApi } from '../services/api';
import type { Lead, Message, FollowUp } from '../types';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'info' | 'followups'>('chat');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (id) loadLeadData();
  }, [id]);

  const loadLeadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [leadRes, msgRes, fuRes] = await Promise.all([
        leadsApi.getById(id),
        leadsApi.getMessages(id, { limit: 50 }),
        followUpsApi.getByLead(id),
      ]);
      setLead(leadRes.data.data);
      setMessages(msgRes.data.data || []);
      setFollowUps(fuRes.data.data || []);
    } catch (error) {
      console.error('Error loading lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!id) return;
    try {
      await leadsApi.claim(id);
      loadLeadData();
    } catch (error) {
      console.error('Error claiming lead:', error);
    }
  };

  const handleAddNote = async () => {
    if (!id || !newNote.trim()) return;
    try {
      await leadsApi.addNote(id, newNote);
      setNewNote('');
      loadLeadData();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Lead não encontrado</p>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Voltar para leads
        </button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success-600';
    if (score >= 40) return 'text-warning-600';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate('/leads')}
        className="flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar para leads
      </button>

      {/* Lead header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-bold text-xl">
                {lead.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-slate-900">
                {lead.name || 'Lead sem nome'}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {lead.phone}
                  </span>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {lead.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className={`w-5 h-5 ${getScoreColor(lead.score)}`} />
                <span className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                  {lead.score}
                </span>
              </div>
              <p className="text-xs text-slate-400">Score</p>
            </div>
            {!lead.claimedByBroker && lead.state.prontoParaCorretor && (
              <button
                onClick={handleClaim}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Resgatar Lead
              </button>
            )}
            {lead.claimedByBroker && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-success-50 text-success-600 text-sm font-medium rounded-lg">
                <CheckCircle className="w-4 h-4" />
                Resgatado
              </span>
            )}
          </div>
        </div>

        {/* Qualification info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Perfil</p>
              <p className="text-sm font-medium text-slate-700">
                {lead.state.perfilEstimado === 'Indefinido' ? '—' : lead.state.perfilEstimado}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Home className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tipo de Imóvel</p>
              <p className="text-sm font-medium text-slate-700">
                {lead.state.tipoImovel || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Orçamento</p>
              <p className="text-sm font-medium text-slate-700">
                {lead.state.orcamentoEstimado || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Região</p>
              <p className="text-sm font-medium text-slate-700">
                {lead.state.regiaoInteresse || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex border-b border-slate-100">
          {[
            { key: 'chat' as const, label: 'Conversa', icon: MessageSquare },
            { key: 'info' as const, label: 'Informações', icon: User },
            { key: 'followups' as const, label: 'Follow-ups', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'chat' && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhuma mensagem ainda</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.direction === 'inbound'
                          ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                          : 'bg-primary-600 text-white rounded-tr-sm'
                      }`}
                    >
                      {msg.content}
                      <p
                        className={`text-xs mt-1 ${
                          msg.direction === 'inbound' ? 'text-slate-400' : 'text-primary-200'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Qualificação</h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Tem filhos', value: lead.state.temFilhos === null ? '—' : lead.state.temFilhos ? 'Sim' : 'Não' },
                    { label: 'Quantos filhos', value: lead.state.quantosFilhos || '—' },
                    { label: 'Dor principal', value: lead.state.dorPrincipal || '—' },
                    { label: 'Urgência', value: lead.state.urgencia || '—' },
                    { label: 'Agente atual', value: lead.state.agenteAtual },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <dt className="text-sm text-slate-500">{item.label}</dt>
                      <dd className="text-sm font-medium text-slate-800">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Anotações</h3>
                <div className="space-y-3">
                  {lead.notes ? (
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{lead.notes}</p>
                  ) : (
                    <p className="text-sm text-slate-400">Nenhuma anotação</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Adicionar anotação..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'followups' && (
            <div className="space-y-4">
              {followUps.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhum follow-up agendado</p>
              ) : (
                followUps.map((fu) => (
                  <div
                    key={fu._id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800 capitalize">{fu.type}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(fu.scheduledAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        fu.status === 'pendente'
                          ? 'bg-warning-50 text-warning-600'
                          : fu.status === 'concluido'
                          ? 'bg-success-50 text-success-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {fu.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
