import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ShieldCheck, ArrowRight, Calendar, Search, AlertCircle } from 'lucide-react';
import { ResearchSession } from '../types';

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
      })
      .then((data: any) => {
        setSessions(data.sessions || []);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error loading history');
        setIsLoading(false);
      });
  }, []);

  const getStatusBadge = (status: ResearchSession['status']) => {
    switch (status) {
      case 'complete':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Complete
          </span>
        );
      case 'error':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Research Audit Archive</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical deep research sessions persisted with immutable audit trails
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span>New Research</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading audit archive...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Research Sessions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Launch your first deep research inquiry to establish an auditable provenance report.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            <span>Start First Inquiry</span>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {sessions.map((sess) => (
            <Link
              key={sess.id}
              to={`/research/${sess.id}`}
              className="flex items-center justify-between p-5 hover:bg-slate-800/50 transition group"
            >
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="flex items-center space-x-2.5">
                  {getStatusBadge(sess.status)}
                  <span className="text-xs font-mono text-slate-500">{sess.id}</span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-slate-200 group-hover:text-emerald-300 transition line-clamp-1">
                  {sess.query}
                </h3>

                <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(sess.createdAt).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
