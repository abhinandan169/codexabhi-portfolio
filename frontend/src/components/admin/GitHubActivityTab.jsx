import React, { useEffect, useState, useCallback } from 'react';
import { Save, Loader2, Github, RefreshCw, Link2, Link2Off, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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

const GitHubActivityTab = () => {
  const [w, setW] = useState(null);
  const [profile, setProfile] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [urlOk, setUrlOk] = useState(null); // null | true | false

  const load = useCallback(async () => {
    try {
      const [wr, pr] = await Promise.all([api.get('/widgets'), api.get('/profile')]);
      setW(wr.data);
      setProfile(pr.data);
    } catch { toast.error('Failed to load settings'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!w || !profile) return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin" style={{ color: 'var(--accent)' }} /></div>;

  const gh = w.github || {};
  const username = profile.github_username || '';
  const connected = !!username;

  const setGh = (k, v) => setW({ ...w, github: { ...gh, [k]: v } });

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.put('/admin/widgets', { github: w.github, live_info: w.live_info });
      toast.success('GitHub settings saved');
    } catch { toast.error('Save failed'); }
    finally { setSavingConfig(false); }
  };

  const saveUsername = async () => {
    setSavingUsername(true);
    try {
      await api.put('/admin/profile', { github_username: username });
      toast.success(username ? 'GitHub connected' : 'GitHub disconnected');
      load();
    } catch { toast.error('Save failed'); }
    finally { setSavingUsername(false); }
  };

  const disconnect = async () => {
    setProfile({ ...profile, github_username: '' });
    setSavingUsername(true);
    try {
      await api.put('/admin/profile', { github_username: '' });
      toast.success('GitHub disconnected');
      load();
    } catch { toast.error('Failed to disconnect'); }
    finally { setSavingUsername(false); }
  };

  const doSync = async () => {
    if (!username) { toast.error('Set a GitHub username first'); return; }
    setSyncing(true);
    try {
      const r = await api.post('/admin/github/sync');
      toast.success('Refreshed. Portfolio images will bust cache.');
      setW({ ...w, github: { ...gh, last_sync: r.data.last_sync } });
    } catch { toast.error('Refresh failed'); }
    finally { setSyncing(false); }
  };

  const verify = async () => {
    if (!username) return;
    setUrlOk(null);
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
      setUrlOk(res.ok);
      if (res.ok) toast.success('GitHub username exists.');
      else toast.error('GitHub username not found.');
    } catch { setUrlOk(false); toast.error('GitHub API not reachable.'); }
  };

  const last = gh.last_sync ? new Date(gh.last_sync) : null;

  return (
    <div className="space-y-6" data-testid="github-manager-tab">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Github size={22} /> GitHub Activity Manager</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Control the GitHub section on your portfolio — no code changes required.</p>
      </div>

      {/* Connection card */}
      <div className="card-soft p-6" data-testid="gh-connection-card">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            {connected ? <Link2 size={18} /> : <Link2Off size={18} />}
          </span>
          <div className="flex-1">
            <div className="font-bold">{connected ? 'Connected' : 'Not Connected'}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {connected ? `Showing data for @${username}` : 'Enter your GitHub username to enable this section.'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="input-x flex-1 min-w-[200px]"
            placeholder="e.g. torvalds"
            value={username}
            onChange={(e) => setProfile({ ...profile, github_username: e.target.value.trim() })}
            data-testid="gh-username-input"
          />
          <button onClick={verify} className="btn-secondary" data-testid="gh-verify-btn">
            {urlOk === true ? <CheckCircle2 size={16} /> : urlOk === false ? <AlertCircle size={16} /> : <Github size={16} />} Verify
          </button>
          <button onClick={saveUsername} disabled={savingUsername} className="btn-primary" data-testid="gh-save-username-btn">
            {savingUsername ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
          {connected && (
            <button onClick={disconnect} className="btn-secondary" style={{ color: 'var(--accent)' }} data-testid="gh-disconnect-btn">
              <Link2Off size={16} /> Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Section-wide controls */}
      <div className="card-soft p-6" data-testid="gh-section-controls">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold">Section &amp; Refresh</h3>
          <button onClick={saveConfig} disabled={savingConfig} className="btn-primary" data-testid="gh-save-config-btn">
            {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        </div>
        <div className="mt-2">
          <Row label="Enable GitHub Activity Section" hint="When off, the entire GitHub section is hidden from the portfolio." testId="gh-row-enabled">
            <Toggle checked={gh.enabled !== false} onChange={(v) => setGh('enabled', v)} testId="gh-toggle-enabled" />
          </Row>
          <Row label="Auto Refresh" hint="Bumps cache-busting param when portfolio loads so images re-fetch periodically." testId="gh-row-auto">
            <Toggle checked={!!gh.auto_refresh} onChange={(v) => setGh('auto_refresh', v)} testId="gh-toggle-auto" />
          </Row>
          <Row label="Last Sync" hint={last ? `${last.toLocaleString()}` : 'Never synced.'} testId="gh-row-last-sync">
            <button onClick={doSync} disabled={syncing || !username} className="btn-secondary text-sm" data-testid="gh-refresh-btn">
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh now
            </button>
          </Row>
        </div>
      </div>

      {/* Individual widget toggles */}
      <div className="card-soft p-6" data-testid="gh-widgets-controls">
        <h3 className="font-bold mb-2">Sub-widgets</h3>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Toggle individual cards inside the GitHub section.</p>
        <Row label="Contribution Calendar" testId="gh-row-calendar">
          <Toggle checked={gh.show_calendar !== false} onChange={(v) => setGh('show_calendar', v)} testId="gh-toggle-calendar" />
        </Row>
        <Row label="GitHub Stats Card" testId="gh-row-stats">
          <Toggle checked={gh.show_stats !== false} onChange={(v) => setGh('show_stats', v)} testId="gh-toggle-stats" />
        </Row>
        <Row label="Streak Card" testId="gh-row-streak">
          <Toggle checked={gh.show_streak !== false} onChange={(v) => setGh('show_streak', v)} testId="gh-toggle-streak" />
        </Row>
        <Row label="Top Languages" testId="gh-row-langs">
          <Toggle checked={gh.show_langs !== false} onChange={(v) => setGh('show_langs', v)} testId="gh-toggle-langs" />
        </Row>
      </div>
    </div>
  );
};

export default GitHubActivityTab;
