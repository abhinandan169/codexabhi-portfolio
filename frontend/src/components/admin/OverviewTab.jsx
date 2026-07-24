import React, { useEffect, useState } from 'react';
import { Briefcase, Code2, Award, GraduationCap, MessageSquare, Download, Eye, Clock, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';

const cards = [
  { key: 'projects', label: 'Projects', icon: Briefcase, color: '#E53935' },
  { key: 'skills', label: 'Skills', icon: Code2, color: '#2563EB' },
  { key: 'certificates', label: 'Certificates', icon: Award, color: '#7C3AED' },
  { key: 'education', label: 'Education', icon: GraduationCap, color: '#059669' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, color: '#EA580C' },
  { key: 'resume_downloads', label: 'Resume Downloads', icon: Download, color: '#0891B2' },
  { key: 'views', label: 'Portfolio Views', icon: Eye, color: '#DB2777' },
];

const OverviewTab = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data));
    api.get('/admin/activity?page=1&page_size=5').then((r) => setRecent(r.data.items || []));
  }, []);

  const lastUpdated = stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : '—';

  return (
    <div className="space-y-6" data-testid="overview-tab">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>A quick glance at your portfolio activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
        {cards.map((c) => {
          const val = stats ? stats[c.key] ?? 0 : '—';
          return (
            <div key={c.key} className="card-soft p-5" data-testid={`stat-${c.key}`}>
              <div className="flex items-start justify-between">
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: c.color + '20', color: c.color }}
                >
                  <c.icon size={20} />
                </span>
                {c.key === 'messages' && stats?.unread_messages > 0 && (
                  <span className="badge-red text-xs" style={{ padding: '0.15rem 0.5rem' }}>
                    {stats.unread_messages} new
                  </span>
                )}
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase font-semibold tracking-widest" style={{ color: 'var(--text-secondary)' }}>{c.label}</div>
                <div className="text-3xl font-bold mt-1">{val}</div>
              </div>
            </div>
          );
        })}
        <div className="card-soft p-5" data-testid="stat-last-updated">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FFEBEE] text-[#E53935]"><Clock size={20} /></span>
          <div className="mt-4">
            <div className="text-xs uppercase font-semibold tracking-widest" style={{ color: 'var(--text-secondary)' }}>Last Updated</div>
            <div className="text-sm font-semibold mt-1 leading-tight">{lastUpdated}</div>
          </div>
        </div>
      </div>

      <div className="card-soft p-6" data-testid="recent-activity">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Activity</h2>
          <button onClick={() => onNavigate?.('activity')} className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: 'var(--accent)' }} data-testid="overview-activity-link">
            View all <ArrowUpRight size={14} />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }} data-testid={`recent-${r.id}`}>
                <div>
                  <div className="text-sm font-semibold">{r.action}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.details}</div>
                </div>
                <div className="text-xs mono" style={{ color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
