import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Eye, Download, MessageSquare, TrendingUp, Users, UserCheck, Monitor, Globe, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const PIE_COLORS = ['#E53935', '#2563EB', '#059669', '#7C3AED', '#EA580C', '#DB2777', '#0891B2', '#111111'];

const StatCard = ({ icon: Icon, label, value, color = '#E53935', testId }) => (
  <div className="card-soft p-5" data-testid={testId}>
    <div className="flex items-center justify-between">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20', color }}>
        <Icon size={20} />
      </span>
    </div>
    <div className="mt-4">
      <div className="text-xs uppercase font-semibold tracking-widest" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  </div>
);

const AnalyticsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/analytics').then((r) => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading || !data) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
  );

  return (
    <div className="space-y-6" data-testid="analytics-tab">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Traffic, engagement and audience insights.</p>
        </div>
        <button onClick={load} className="btn-secondary" data-testid="analytics-refresh">Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Total Views" value={data.total_views} testId="analytics-total-views" />
        <StatCard icon={TrendingUp} label="Today" value={data.today_views} color="#2563EB" testId="analytics-today" />
        <StatCard icon={TrendingUp} label="This Week" value={data.weekly_views} color="#059669" testId="analytics-weekly" />
        <StatCard icon={TrendingUp} label="This Month" value={data.monthly_views} color="#7C3AED" testId="analytics-monthly" />
        <StatCard icon={Download} label="Resume Downloads" value={data.resume_downloads} color="#EA580C" testId="analytics-downloads" />
        <StatCard icon={MessageSquare} label="Contact Submissions" value={data.contact_submissions} color="#DB2777" testId="analytics-contacts" />
        <StatCard icon={Users} label="Unique Visitors" value={data.unique_visitors} color="#0891B2" testId="analytics-unique" />
        <StatCard icon={UserCheck} label="Returning" value={data.returning_visitors} color="#111111" testId="analytics-returning" />
      </div>

      {/* Line chart - views over time */}
      <div className="card-soft p-6" data-testid="analytics-line-chart">
        <h3 className="font-bold mb-4">Views — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.time_series}>
            <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Line type="monotone" dataKey="views" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Devices */}
        <div className="card-soft p-6" data-testid="analytics-devices">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Monitor size={16} /> Devices</h3>
          {data.devices.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet.</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.devices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Browsers */}
        <div className="card-soft p-6" data-testid="analytics-browsers">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Globe size={16} /> Browsers</h3>
          {data.browsers.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet.</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.browsers}>
                <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Traffic sources */}
        <div className="card-soft p-6 lg:col-span-2" data-testid="analytics-sources">
          <h3 className="font-bold mb-4">Traffic Sources</h3>
          {data.traffic_sources.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet.</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.traffic_sources.map((s, i) => (
                <div key={s.name} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-sm font-semibold capitalize truncate">{s.name}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data.most_viewed_project?.id && (
          <div className="card-soft p-6 lg:col-span-2" data-testid="analytics-top-project">
            <h3 className="font-bold mb-2">Most Viewed Project</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">{data.most_viewed_project.title}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{data.most_viewed_project.count} views</div>
              </div>
              <span className="badge-red">Top</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;
