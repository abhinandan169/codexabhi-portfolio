import React, { useEffect, useState, useCallback } from 'react';
import { Save, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const Toggle = ({ checked, onChange, testId }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors flex-shrink-0"
    style={{ backgroundColor: checked ? 'var(--accent)' : 'var(--border)' }}
    data-testid={testId}
    aria-checked={checked}
    role="switch"
  >
    <span
      className="inline-block w-4 h-4 bg-white rounded-full shadow transition-transform"
      style={{ transform: checked ? 'translateX(24px)' : 'translateX(4px)' }}
    />
  </button>
);

const Row = ({ label, hint, children, testId }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }} data-testid={testId}>
    <div className="min-w-0">
      <div className="text-sm font-semibold">{label}</div>
      {hint && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hint}</div>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const INTERVALS = [10, 15, 30, 60];

const LiveInfoTab = () => {
  const [w, setW] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/widgets');
      setW(r.data);
    } catch { toast.error('Failed to load settings'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!w) return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin" style={{ color: 'var(--accent)' }} /></div>;

  const li = w.live_info || {};
  const setLi = (k, v) => setW({ ...w, live_info: { ...li, [k]: v } });

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/widgets', { live_info: w.live_info, github: w.github });
      toast.success('Live Info settings saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6" data-testid="live-info-manager-tab">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles size={20} /> Live Info Card Manager</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Control the floating card on your portfolio.
            <a href="/" target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--accent)' }} data-testid="live-preview-link">
              Preview <ExternalLink size={11} />
            </a>
          </p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary" data-testid="live-save-btn">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      <div className="card-soft p-6" data-testid="live-general-card">
        <h3 className="font-bold mb-2">General</h3>
        <Row label="Enable Card" hint="Show the floating live info card on the portfolio." testId="live-row-enabled">
          <Toggle checked={li.enabled !== false} onChange={(v) => setLi('enabled', v)} testId="live-toggle-enabled" />
        </Row>
        <Row label="Position" hint="Where the card floats on desktop." testId="live-row-position">
          <div className="flex border rounded-full overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {[{ v: 'left', l: 'Bottom Left' }, { v: 'right', l: 'Bottom Right' }].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setLi('position', opt.v)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: (li.position || 'right') === opt.v ? 'var(--accent)' : 'transparent',
                  color: (li.position || 'right') === opt.v ? '#fff' : 'var(--text-secondary)',
                }}
                data-testid={`live-position-${opt.v}`}
              >{opt.l}</button>
            ))}
          </div>
        </Row>
        <Row label="Pulse Animation" hint="Green online dot ping animation." testId="live-row-pulse">
          <Toggle checked={li.pulse_animation !== false} onChange={(v) => setLi('pulse_animation', v)} testId="live-toggle-pulse" />
        </Row>
        <Row label="Show on Mobile" hint="Display the floating card on mobile devices (< 768px)." testId="live-row-mobile">
          <Toggle checked={li.show_on_mobile === true} onChange={(v) => setLi('show_on_mobile', v)} testId="live-toggle-mobile" />
        </Row>
        <Row label="Dismissible" hint="Show the × button so visitors can close the card." testId="live-row-dismissible">
          <Toggle checked={li.dismissible !== false} onChange={(v) => setLi('dismissible', v)} testId="live-toggle-dismissible" />
        </Row>
        <Row label="Refresh Interval" hint="How often the card polls for new stats." testId="live-row-interval">
          <div className="flex border rounded-full overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {INTERVALS.map((v) => (
              <button
                key={v}
                onClick={() => setLi('refresh_interval', v)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors mono"
                style={{
                  backgroundColor: (li.refresh_interval || 15) === v ? 'var(--accent)' : 'transparent',
                  color: (li.refresh_interval || 15) === v ? '#fff' : 'var(--text-secondary)',
                }}
                data-testid={`live-interval-${v}`}
              >{v}s</button>
            ))}
          </div>
        </Row>
      </div>

      <div className="card-soft p-6" data-testid="live-visibility-card">
        <h3 className="font-bold mb-2">What to show</h3>
        <Row label="Online Status" testId="live-row-online">
          <Toggle checked={li.show_online !== false} onChange={(v) => setLi('show_online', v)} testId="live-toggle-online" />
        </Row>
        <Row label="Visitor Count" testId="live-row-visitors">
          <Toggle checked={li.show_visitors !== false} onChange={(v) => setLi('show_visitors', v)} testId="live-toggle-visitors" />
        </Row>
        <Row label="Portfolio Views" testId="live-row-views">
          <Toggle checked={li.show_views !== false} onChange={(v) => setLi('show_views', v)} testId="live-toggle-views" />
        </Row>
        <Row label="Last Updated" testId="live-row-updated">
          <Toggle checked={li.show_updated !== false} onChange={(v) => setLi('show_updated', v)} testId="live-toggle-updated" />
        </Row>
      </div>

      <div className="card-soft p-6" data-testid="live-theme-note">
        <h3 className="font-bold mb-1">Theme</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          The Live Info card automatically uses your current Appearance theme (colors, radius, glass, shadow intensity). Adjust it from the <span className="font-semibold">Appearance</span> tab.
        </p>
      </div>
    </div>
  );
};

export default LiveInfoTab;
