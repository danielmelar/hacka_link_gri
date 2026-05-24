import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/portfolio', label: 'Portfólio', icon: Building2 },
  { path: '/agents', label: 'Agentes', icon: Bot },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/messages', label: 'Mensagens', icon: MessageSquare },
  { path: '/settings', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const broker = useAuthStore((s) => s.broker);
  const location = useLocation();

  return (
    <aside
      className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        {!collapsed && (
          <span className="ml-3 font-semibold text-slate-800 text-lg tracking-tight">
            CLAVIS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-slate-100">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center w-full px-3 py-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-3 text-sm">Recolher</span>
            </>
          )}
        </button>

        {/* User info */}
        {!collapsed && broker && (
          <div className="mt-2 px-3 py-2">
            <p className="text-xs text-slate-500 truncate">{broker.email}</p>
            <p className="text-xs font-medium text-primary-600 capitalize">{broker.plan}</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 mt-1 text-slate-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3 text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
