import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { settingsApi } from '../services/api';
import {
  User,
  Bell,
  Clock,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Loader2,
  Save,
} from 'lucide-react';
import type { BrokerSettings } from '../types';

export default function Settings() {
  const broker = useAuthStore((s) => s.broker);
  const [settings, setSettings] = useState<BrokerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notificationEmail: true,
    notificationPush: true,
    autoQualification: true,
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    timezone: 'America/Sao_Paulo',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      const data = res.data.data;
      setSettings(data);
      setFormData({
        name: data.profile.name || '',
        phone: data.profile.phone || '',
        notificationEmail: data.settings.notificationEmail,
        notificationPush: data.settings.notificationPush,
        autoQualification: data.settings.autoQualification,
        workingHoursStart: data.settings.workingHours.start,
        workingHoursEnd: data.settings.workingHours.end,
        timezone: data.settings.workingHours.timezone,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update({
        name: formData.name,
        phone: formData.phone,
        settings: {
          notificationEmail: formData.notificationEmail,
          notificationPush: formData.notificationPush,
          autoQualification: formData.autoQualification,
          workingHours: {
            start: formData.workingHoursStart,
            end: formData.workingHoursEnd,
            timezone: formData.timezone,
          },
        },
      });
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (settings?.deepLink) {
      navigator.clipboard.writeText(settings.deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateLink = async () => {
    try {
      const res = await settingsApi.regenerateLink();
      setSettings({ ...settings!, deepLink: res.data.data.deepLink });
    } catch (error) {
      console.error('Error regenerating link:', error);
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
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie seu perfil e preferências</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Perfil</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={broker?.email || ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Plano</label>
            <input
              type="text"
              value={broker?.plan || 'free'}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed capitalize"
            />
          </div>
        </div>
      </div>

      {/* Deep Link */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <LinkIcon className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Link do Telegram</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Compartilhe este link com seus leads para que eles iniciem uma conversa com a Sofia no Telegram.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 truncate">
            {settings?.deepLink || '—'}
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={handleRegenerateLink}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
          >
            Regenerar
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Notificações</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-800">Email</p>
              <p className="text-xs text-slate-500">Receba notificações por email</p>
            </div>
            <input
              type="checkbox"
              checked={formData.notificationEmail}
              onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-800">Push</p>
              <p className="text-xs text-slate-500">Notificações em tempo real no dashboard</p>
            </div>
            <input
              type="checkbox"
              checked={formData.notificationPush}
              onChange={(e) => setFormData({ ...formData, notificationPush: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-800">Qualificação automática</p>
              <p className="text-xs text-slate-500">A IA qualifica leads automaticamente</p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoQualification}
              onChange={(e) => setFormData({ ...formData, autoQualification: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Horário de Trabalho</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Início</label>
            <input
              type="time"
              value={formData.workingHoursStart}
              onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fim</label>
            <input
              type="time"
              value={formData.workingHoursEnd}
              onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar alterações
            </>
          )}
        </button>
      </div>
    </div>
  );
}
