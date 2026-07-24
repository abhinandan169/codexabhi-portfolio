import React, { useEffect, useState } from 'react';
import { Save, Loader2, Github, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const SECTIONS = [
  { key: 'hero', label: 'Hero' },
  { key: 'about', label: 'About Me' },
  { key: 'counters', label: 'Achievement Counters' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'resume', label: 'Resume' },
  { key: 'hire_me', label: 'Hire Me' },
  { key: 'contact', label: 'Contact' },
  { key: 'footer', label: 'Footer' },
];

// Widgets exposed in Section Visibility (backed by /api/widgets, not /api/sections)
const WIDGETS = [
  { key: 'github', label: 'GitHub Activity', icon: Github, testId: 'visibility-widget-github' },
  { key: 'live_info', label: 'Live Info Card', icon: Sparkles, testId: 'visibility-widget-live_info' },
];

const VisibilityTab = () => {
  const [s, setS] = useState(null);
  const [w, setW] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/sections'), api.get('/widgets')])
      .then(([sr, wr]) => { setS(sr.data || {}); setW(wr.data || {}); })
      .catch(() => toast.error('Failed to load visibility settings'));
  }, []);

  const toggle = (k) => setS({ ...s, [k]: !s[k] });
  const toggleWidget = (k) => setW({ ...w, [k]: { ...(w?.[k] || {}), enabled: !(w?.[k]?.enabled !== false) } });

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.put('/admin/sections', s),
        api.put('/admin/widgets', { github: w.github, live_info: w.live_info }),
      ]);
      toast.success('Visibility updated');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (!s || !w) return <div>Loading...</div>;

  return (
    <div className="space-y-6" data-testid="visibility-tab">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Section Visibility</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Toggle homepage sections on/off. Changes apply instantly after save.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary" data-testid="visibility-save-btn">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="visibility-grid">
        {SECTIONS.map((sec) => {
          const on = !!s[sec.key];
          return (
            <button
              key={sec.key}
              onClick={() => toggle(sec.key)}
              className="card-soft p-4 flex items-center justify-between text-left"
              data-testid={`visibility-${sec.key}`}
            >
              <div>
                <div className="font-semibold">{sec.label}</div>
                <div className="text-xs mt-1" style={{ color: on ? 'var(--accent)' : 'var(--text-muted)' }}>{on ? 'Visible' : 'Hidden'}</div>
              </div>
              <span className="relative inline-flex items-center h-7 w-12 rounded-full transition-colors" style={{ backgroundColor: on ? 'var(--accent)' : 'var(--border)' }}>
                <span className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: on ? 'translateX(24px)' : 'translateX(4px)' }} />
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Widgets</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="visibility-widgets-grid">
          {WIDGETS.map((wd) => {
            const on = w?.[wd.key]?.enabled !== false;
            return (
              <button
                key={wd.key}
                onClick={() => toggleWidget(wd.key)}
                className="card-soft p-4 flex items-center justify-between text-left"
                data-testid={wd.testId}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}><wd.icon size={16} /></span>
                  <div>
                    <div className="font-semibold">{wd.label}</div>
                    <div className="text-xs mt-1" style={{ color: on ? 'var(--accent)' : 'var(--text-muted)' }}>{on ? 'Visible' : 'Hidden'}</div>
                  </div>
                </div>
                <span className="relative inline-flex items-center h-7 w-12 rounded-full transition-colors" style={{ backgroundColor: on ? 'var(--accent)' : 'var(--border)' }}>
                  <span className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: on ? 'translateX(24px)' : 'translateX(4px)' }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VisibilityTab;
