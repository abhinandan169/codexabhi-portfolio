import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Github, GitCommit, Star, GitFork, Users as UsersIcon, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

/**
 * GitHub activity section. Renders natively using the public GitHub REST API
 * (no external image services) so widgets always load. Reads visibility and
 * sub-widget toggles from /api/widgets.
 */

// GitHub official contribution scale (light theme).
const LIGHT_LEVELS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
// GitHub official contribution scale (dark theme).
const DARK_LEVELS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

// Language color map (subset of GitHub's colors.json). Fallback to accent.
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
  'C++': '#f34b7d', C: '#555555', 'C#': '#178600', Go: '#00ADD8', Rust: '#dea584',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c', Vue: '#41b883', Shell: '#89e051',
  Dockerfile: '#384d54', 'Jupyter Notebook': '#DA5B0B', SQL: '#e38c00', R: '#198CE7',
  Scala: '#c22d40', Perl: '#0298c3', Lua: '#000080', Haskell: '#5e5086', Elixir: '#6e4a7e',
  'Objective-C': '#438eff', Solidity: '#AA6746', TeX: '#3D6117',
};

// ---------------- Contribution Calendar ----------------
const CELL = 11;
const GAP = 3;
const CalendarGrid = ({ username, bust }) => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      // Rough detection: hex starting with #0/1 or 'rgb(1'/rgb(2' small
      setIsDark(document.documentElement.classList.contains('dark') || /^#0|^#1/.test(bg));
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((j) => { if (alive) { setData(j); setStatus('ok'); } })
      .catch(() => { if (alive) setStatus('error'); });
    return () => { alive = false; };
    // bust triggers refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, bust]);

  const levels = isDark ? DARK_LEVELS : LIGHT_LEVELS;
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(27,31,35,0.06)';

  const weeks = useMemo(() => {
    if (!data?.contributions) return [];
    // Build a lookup by date
    const map = new Map(data.contributions.map((c) => [c.date, c]));
    const days = data.contributions;
    if (days.length === 0) return [];
    // Align first cell to the correct weekday. GitHub weeks start Sunday.
    const first = new Date(days[0].date + 'T00:00:00Z');
    const startDow = first.getUTCDay(); // 0=Sun
    const start = new Date(first);
    start.setUTCDate(start.getUTCDate() - startDow);
    const result = [];
    let cursor = new Date(start);
    // Iterate up to 53 weeks
    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const iso = cursor.toISOString().slice(0, 10);
        const c = map.get(iso);
        week.push({ date: iso, count: c?.count ?? null, level: c?.level ?? 0, inRange: !!c });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      result.push(week);
      if (cursor > new Date(days[days.length - 1].date + 'T00:00:00Z')) {
        // include one more week only if we haven't overshot too far
        if (w >= 51) break;
      }
    }
    return result;
  }, [data]);

  const months = useMemo(() => {
    // Return array of {label, weekIndex} for month labels
    const out = [];
    let lastMonth = -1;
    weeks.forEach((wk, i) => {
      const first = wk[0];
      if (!first?.date) return;
      const m = new Date(first.date + 'T00:00:00Z').getUTCMonth();
      if (m !== lastMonth) {
        out.push({ label: new Date(first.date + 'T00:00:00Z').toLocaleString('en', { month: 'short' }), i });
        lastMonth = m;
      }
    });
    return out;
  }, [weeks]);

  const width = weeks.length * (CELL + GAP);
  const height = 7 * (CELL + GAP);
  const total = data?.total ? Object.values(data.total).reduce((a, b) => a + Number(b || 0), 0) : 0;

  if (status === 'loading') {
    return <div className="flex items-center justify-center py-10 text-sm" style={{ color: 'var(--text-muted)' }} data-testid="gh-cal-loading"><Loader2 size={16} className="animate-spin mr-2" /> Loading contributions…</div>;
  }
  if (status === 'error') {
    return <div className="flex items-center justify-center py-6 text-sm" style={{ color: 'var(--text-muted)' }} data-testid="gh-cal-error"><AlertCircle size={14} className="mr-2" /> Could not load contribution data for @{username}.</div>;
  }

  return (
    <div className="w-full" data-testid="gh-cal-native">
      <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        <span className="mono font-semibold" style={{ color: 'var(--text-primary)' }}>{total.toLocaleString()}</span> contributions in the last year
      </div>
      <div className="w-full overflow-x-auto">
        <svg width={width + 30} height={height + 22} role="img" aria-label={`GitHub contributions for ${username}`}>
          {/* Month labels */}
          {months.map((m) => (
            <text key={`m-${m.i}`} x={30 + m.i * (CELL + GAP)} y={10} fontSize="10" fill="currentColor" style={{ color: 'var(--text-muted)' }} opacity={0.7}>{m.label}</text>
          ))}
          {/* Weekday labels: Mon, Wed, Fri */}
          {['Mon', 'Wed', 'Fri'].map((d, idx) => {
            const rowIndex = [1, 3, 5][idx];
            return (
              <text key={d} x={0} y={22 + rowIndex * (CELL + GAP) + CELL} fontSize="9" fill="currentColor" style={{ color: 'var(--text-muted)' }} opacity={0.7}>{d}</text>
            );
          })}
          {/* Cells */}
          <g transform={`translate(30, 16)`}>
            {weeks.map((wk, wi) => wk.map((day, di) => {
              const x = wi * (CELL + GAP);
              const y = di * (CELL + GAP);
              const fill = day.inRange ? levels[Math.min(4, day.level || 0)] : 'transparent';
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={x} y={y}
                  width={CELL} height={CELL}
                  rx={2} ry={2}
                  fill={fill}
                  stroke={borderColor}
                  strokeWidth={1}
                >
                  <title>{day.inRange ? `${day.count} contributions on ${day.date}` : ''}</title>
                </rect>
              );
            }))}
          </g>
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Less</span>
        {levels.map((c, i) => (
          <span key={i} style={{ width: CELL, height: CELL, backgroundColor: c, borderRadius: 2, display: 'inline-block', border: `1px solid ${borderColor}` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

// ---------------- Stats Card ----------------
const StatsCard = ({ username, bust }) => {
  const [state, setState] = useState({ status: 'loading', user: null, stars: 0, err: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`),
      ]);
      if (!uRes.ok) throw new Error(`user ${uRes.status}`);
      const user = await uRes.json();
      let stars = 0;
      if (rRes.ok) {
        const repos = await rRes.json();
        stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
      }
      setState({ status: 'ok', user, stars, err: null });
    } catch (e) {
      setState({ status: 'error', user: null, stars: 0, err: String(e) });
    }
  }, [username]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [username, bust]);

  if (state.status === 'loading') return <div className="flex items-center justify-center py-8 text-sm" style={{ color: 'var(--text-muted)' }} data-testid="gh-stats-loading"><Loader2 size={16} className="animate-spin mr-2" /> Loading GitHub stats…</div>;
  if (state.status === 'error' || !state.user) return <div className="flex items-center justify-center py-6 text-sm" style={{ color: 'var(--text-muted)' }} data-testid="gh-stats-error"><AlertCircle size={14} className="mr-2" /> Stats unavailable for @{username}.</div>;

  const u = state.user;
  const items = [
    { icon: BookOpen, label: 'Public Repos', value: u.public_repos },
    { icon: Star, label: 'Total Stars', value: state.stars },
    { icon: UsersIcon, label: 'Followers', value: u.followers },
    { icon: UsersIcon, label: 'Following', value: u.following },
    { icon: GitFork, label: 'Public Gists', value: u.public_gists },
  ];

  return (
    <div className="space-y-5" data-testid="gh-stats-native">
      <div className="flex items-center gap-3">
        <img src={u.avatar_url} alt={u.login} loading="lazy" className="w-14 h-14 rounded-full" style={{ border: '2px solid var(--accent)' }} />
        <div className="min-w-0">
          <div className="font-bold text-lg truncate">{u.name || u.login}</div>
          <a href={u.html_url} target="_blank" rel="noreferrer" className="text-xs" style={{ color: 'var(--accent)' }}>@{u.login}</a>
          {u.bio && <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{u.bio}</div>}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map((it) => (
          <div key={it.label} className="text-center rounded-xl py-3 px-2" style={{ backgroundColor: 'var(--bg-alt)', border: '1px solid var(--border-soft)' }}>
            <div className="flex items-center justify-center mb-1" style={{ color: 'var(--accent)' }}><it.icon size={14} /></div>
            <div className="mono text-lg font-bold">{Number(it.value || 0).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wide leading-tight" style={{ color: 'var(--text-muted)' }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------- Top Languages ----------------
const TopLanguages = ({ username, bust }) => {
  const [state, setState] = useState({ status: 'loading', langs: [] });

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', langs: [] });
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((repos) => {
        const counter = {};
        repos.forEach((r) => {
          const l = r.language;
          if (!l || r.fork) return;
          counter[l] = (counter[l] || 0) + 1;
        });
        const total = Object.values(counter).reduce((a, b) => a + b, 0);
        const sorted = Object.entries(counter)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count, pct: total ? (count / total) * 100 : 0 }));
        if (alive) setState({ status: 'ok', langs: sorted });
      })
      .catch(() => { if (alive) setState({ status: 'error', langs: [] }); });
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [username, bust]);

  if (state.status === 'loading') return <div className="flex items-center justify-center py-8 text-sm" style={{ color: 'var(--text-muted)' }} data-testid="gh-langs-loading"><Loader2 size={16} className="animate-spin mr-2" /> Loading top languages…</div>;
  if (state.status === 'error' || state.langs.length === 0) return <div className="flex items-center justify-center py-6 text-sm" style={{ color: 'var(--text-muted)' }} data-testid="gh-langs-error"><AlertCircle size={14} className="mr-2" /> No language data for @{username}.</div>;

  return (
    <div data-testid="gh-langs-native">
      <div className="flex items-center gap-2 mb-3">
        <Github size={16} style={{ color: 'var(--accent)' }} />
        <span className="font-bold">Most Used Languages</span>
      </div>
      {/* Combined bar */}
      <div className="flex w-full h-3 rounded-full overflow-hidden mb-4" style={{ backgroundColor: 'var(--bg-alt)' }}>
        {state.langs.map((l) => (
          <div key={l.name} style={{ width: `${l.pct}%`, backgroundColor: LANG_COLORS[l.name] || 'var(--accent)' }} title={`${l.name} ${l.pct.toFixed(1)}%`} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {state.langs.map((l) => (
          <div key={l.name} className="flex items-center gap-2">
            <span style={{ width: 10, height: 10, backgroundColor: LANG_COLORS[l.name] || 'var(--accent)', borderRadius: 999, display: 'inline-block' }} />
            <span className="font-semibold">{l.name}</span>
            <span className="mono" style={{ color: 'var(--text-muted)' }}>{l.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------- Main Section ----------------
const GitHubActivity = ({ profile }) => {
  const [widgets, setWidgets] = useState(null);
  const [bust, setBust] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/widgets').then((r) => {
      if (!mounted) return;
      setWidgets(r.data);
      setBust(r.data?.github?.last_sync || '');
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const social = profile?.social || [];
  const username = useMemo(() => {
    if (profile?.github_username) return profile.github_username;
    const gh = social.find?.((s) => s.platform?.toLowerCase() === 'github');
    if (gh?.url) {
      const m = gh.url.match(/github\.com\/([^/]+)/);
      if (m) return m[1];
    }
    return '';
  }, [profile, social]);

  const gh = widgets?.github;
  if (!username) return null;
  if (gh && gh.enabled === false) return null;

  const show = (k, def = true) => (gh ? gh[k] !== false : def);
  const bustParam = bust ? `&_=${encodeURIComponent(bust)}` : '';

  return (
    <section className="section-y" style={{ backgroundColor: 'var(--bg-alt)' }} data-testid="github-activity-section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">GitHub</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            Consistency, in <span style={{ color: 'var(--accent)' }}>green &amp; red.</span>
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
            A live snapshot of my open-source activity, contributions, and streaks.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="github-stats-grid">
          {show('show_stats') && (
            <div className="card-soft p-5 lg:col-span-2" data-testid="github-stats-card">
              <StatsCard username={username} bust={bust} />
            </div>
          )}
          {show('show_streak') && (
            <div className="card-soft p-2 overflow-hidden" data-testid="github-streak-card">
              <img
                src={`https://streak-stats.demolab.com?user=${username}&theme=default&hide_border=true&ring=E53935&fire=E53935&currStreakLabel=E53935${bustParam}`}
                alt="GitHub Streak"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          )}
          {show('show_calendar') && (
            <div className="card-soft p-5 lg:col-span-3" data-testid="github-calendar-card">
              <div className="flex items-center gap-2 mb-4">
                <GitCommit size={16} style={{ color: 'var(--accent)' }} />
                <span className="font-bold">Contribution Calendar</span>
              </div>
              <CalendarGrid username={username} bust={bust} />
            </div>
          )}
          {show('show_langs') && (
            <div className="card-soft p-5 lg:col-span-3" data-testid="github-langs-card">
              <TopLanguages username={username} bust={bust} />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Github size={12} /> Powered by public GitHub API · updates automatically
        </div>
      </div>
    </section>
  );
};

export default GitHubActivity;
