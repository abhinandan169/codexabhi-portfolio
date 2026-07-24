import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const GlobalSearch = ({ open, onClose, onNavigate }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  const doSearch = useCallback(async (val) => {
    if (!val || val.length < 2) { setResults([]); return; }
    try {
      const r = await api.get('/admin/search', { params: { q: val } });
      setResults(r.data.results || []);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(''); setResults([]); }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(q), 200);
    return () => clearTimeout(t);
  }, [q, doSearch]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const TAB_MAP = {
    project: 'projects', skill: 'skills', certificate: 'certificates',
    education: 'education', experience: 'experience', testimonial: 'testimonials',
    social: 'social', message: 'messages',
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24 p-4" onClick={onClose} data-testid="global-search-modal">
      <div className="w-full max-w-xl card-soft overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search projects, skills, messages, experience..."
            data-testid="global-search-input"
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded mono" style={{ backgroundColor: 'var(--bg-alt)', color: 'var(--text-muted)' }}>ESC</kbd>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-alt)]" data-testid="global-search-close"><X size={16} /></button>
        </div>
        <div className="max-h-96 overflow-auto" data-testid="global-search-results">
          {results.length === 0 && q.length >= 2 && (
            <p className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No results.</p>
          )}
          {q.length < 2 && (
            <p className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Type at least 2 characters to search everything.</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.id}-${i}`}
              onClick={() => { onNavigate?.(TAB_MAP[r.type] || 'overview'); onClose(); }}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-alt)] transition-colors"
              data-testid={`search-result-${i}`}
            >
              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded mono" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{r.type}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{r.label}</div>
                {r.sub && <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{r.sub}</div>}
              </div>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
