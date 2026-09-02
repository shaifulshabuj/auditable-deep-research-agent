import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ResearchPage } from './pages/ResearchPage';
import { SessionsPage } from './pages/SessionsPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/research/:id" element={<ResearchPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
          Auditable Deep Research Agent • Deployed on Cloudflare Workers + Vectorize v2 + D1 SQLite • 2026
        </footer>
      </div>
    </Router>
  );
};
