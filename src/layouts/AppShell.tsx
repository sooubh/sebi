import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  SearchCode, 
  GitCompare, 
  CheckSquare, 
  Building2, 
  ShieldCheck, 
  ChevronDown, 
  UserCircle2, 
  Bell, 
  AlertCircle 
} from 'lucide-react';
import { useRoleStore, UserRole } from '../context/useRoleStore';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const { role, setRole } = useRoleStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'SEBI Circulars', href: '/circulars', icon: FileText },
    { name: 'Analysis Workspace', href: '/workspace', icon: SearchCode },
    { name: 'Gap Analysis', href: '/gap-analysis', icon: GitCompare },
    { name: 'Tasks & Evidence', href: '/tasks', icon: CheckSquare },
  ];

  const roles: UserRole[] = ['Compliance Officer', 'IT Admin', 'Operations'];

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'Compliance Officer':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'IT Admin':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Operations':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800">
        
        {/* Brand/Logo Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-white text-lg tracking-wider">R</span>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">RICE</h1>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">Compliance Engine</p>
          </div>
        </div>

        {/* Company Baseline Badge */}
        <div className="px-4 py-3 mx-3 my-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">SOUBH Securities</p>
              <p className="text-[10px] text-slate-400">Baseline Active (v1.2)</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center">
          <div className="flex items-center gap-2 justify-center text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Audit Logging Active</span>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm relative z-30">
          
          {/* Mobile menu trigger / Title */}
          <div className="flex items-center gap-3">
            <div className="md:hidden h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">R</div>
            <h2 className="text-lg font-bold text-slate-800 capitalize">
              {navigation.find(nav => nav.href === location.pathname)?.name || 'Circular Analysis'}
            </h2>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            
            {/* Demo Role Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-all duration-150">
                <UserCircle2 className="h-4 w-4 text-slate-500" />
                <span className="hidden sm:inline">Role:</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getRoleBadgeColor(role)}`}>
                  {role}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
              </button>
              
              {/* Dropdown Menu (simple pure CSS hover or click toggle-friendly design) */}
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 hidden group-focus-within:block group-hover:block transition-all duration-100 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Switch Active Role</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Toggle permissions dynamically for the demo.</p>
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-indigo-50/50 transition-colors ${
                      role === r ? 'text-indigo-600 font-bold bg-indigo-50/30' : 'text-slate-700'
                    }`}
                  >
                    <span>{r}</span>
                    {role === r && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
