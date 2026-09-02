import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Search, History, Cloud, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">Auditable</span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  Deep Research
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">Enterprise Traceability & Vector Provenance</p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Link
            to="/"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              location.pathname === '/'
                ? 'bg-slate-800 text-emerald-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>New Research</span>
          </Link>

          <Link
            to="/sessions"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              location.pathname === '/sessions'
                ? 'bg-slate-800 text-emerald-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Archive</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-800 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Cloudflare Edge</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vectorize v2</span>
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
};
