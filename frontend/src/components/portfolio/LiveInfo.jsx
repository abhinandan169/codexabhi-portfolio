import React, { useEffect, useState } from 'react';
import { Users, Eye, Clock } from 'lucide-react';
import { api } from '@/lib/api';

/**
 * Small floating info card. All visibility, position, and refresh behaviour
 * is controlled by the /api/widgets.live_info settings.
 */
const LiveInfo = () => {
  const [widgets, setWidgets] = useState(null);
  const [data, setData] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // Load widget settings once
  useEffect(() => {
    let alive = true;
    api.get('/widgets').then((r) => { if (alive) setWidgets(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const cfg = widgets?.live_info;
  const enabled = cfg ? cfg.enabled !== false : true;
  const interval = (cfg?.refresh_interval || 15) * 1000;

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await api.get('/analytics/live');
        if (alive) setData(r.data);
      } catch { /* silent */ }
    };
    load();
    const t = setInterval(load, interval);
    return () => { alive = false; clearInterval(t); };
  }, [enabled, interval]);

  if (!enabled || !data || dismissed) return null;

  const position = cfg?.position === 'left' ? 'left-6' : 'right-6';
  const show = (k, def = true) => (cfg ? cfg[k] !== false : def);
  const pulse = cfg ? cfg.pulse_animation !== false : true;
  const showOnMobile = cfg ? cfg.show_on_mobile === true : false;
  const dismissible = cfg ? cfg.dismissible !== false : true;
  const last = data.last_updated ? new Date(data.last_updated) : null;
  const relative = last ? relativeTime(last) : '';

  return (
    <div
      className={`${showOnMobile ? 'block' : 'hidden md:block'} fixed bottom-6 ${position} z-30 card-soft px-4 py-3 text-sm animate-fade-in`}
      data-testid="live-info-card"
    >
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow border text-xs flex items-center justify-center"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          aria-label="Dismiss"
          data-testid="live-info-close"
        >×</button>
      )}

      <div className="flex items-center gap-4">
        {show('show_online') && (
          <div className="flex items-center gap-2" data-testid="live-online">
            <span className="relative flex w-2.5 h-2.5">
              {pulse && <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>}
              <span className="relative w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            </span>
            <span className="font-semibold">Online</span>
          </div>
        )}
        {show('show_online') && (show('show_visitors') || show('show_views')) && (
          <span className="w-px h-4" style={{ backgroundColor: 'var(--border)' }}></span>
        )}
        {show('show_visitors') && (
          <div className="flex items-center gap-1.5" title="Viewers online now" data-testid="live-visitors">
            <Users size={13} style={{ color: 'var(--accent)' }} />
            <span className="mono font-semibold">{data.online_now}</span>
          </div>
        )}
        {show('show_views') && (
          <div className="flex items-center gap-1.5" title="Total portfolio views" data-testid="live-views">
            <Eye size={13} style={{ color: 'var(--accent)' }} />
            <span className="mono font-semibold">{data.views}</span>
          </div>
        )}
      </div>
      {show('show_updated') && relative && (
        <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'var(--text-muted)' }} data-testid="live-updated">
          <Clock size={11} /> Updated {relative}
        </div>
      )}
    </div>
  );
};

function relativeTime(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default LiveInfo;
