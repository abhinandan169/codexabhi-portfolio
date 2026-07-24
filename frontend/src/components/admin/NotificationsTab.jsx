import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

const NotificationsTab = () => {
  const [data, setData] = useState({ items: [], total: 0, unread: 0 });
  const [confirm, setConfirm] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get('/admin/notifications');
    setData(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => { await api.put(`/admin/notifications/${id}/read`); load(); };
  const markAll = async () => { await api.put('/admin/notifications/read-all'); toast.success('All marked read'); load(); };
  const del = async () => { await api.delete(`/admin/notifications/${confirm}`); setConfirm(null); load(); };
  const clearAll = async () => { await api.delete('/admin/notifications'); setConfirmClear(false); toast.success('Cleared'); load(); };

  return (
    <div className="space-y-6" data-testid="notifications-tab">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell size={22} /> Notifications</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {data.total} total · <span style={{ color: 'var(--accent)' }}>{data.unread} unread</span>
          </p>
        </div>
        <div className="flex gap-2">
          {data.unread > 0 && <button onClick={markAll} className="btn-secondary" data-testid="notif-mark-all"><CheckCheck size={14} /> Mark all read</button>}
          {data.total > 0 && <button onClick={() => setConfirmClear(true)} className="btn-secondary" style={{ color: 'var(--accent)' }} data-testid="notif-clear-all"><Trash2 size={14} /> Clear all</button>}
        </div>
      </div>

      <div className="space-y-2" data-testid="notif-list">
        {data.items.length === 0 && <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No notifications.</p>}
        {data.items.map((n) => (
          <div key={n.id}
            className="card-soft p-4 flex items-start gap-3"
            style={{ borderLeft: n.read ? '' : '4px solid var(--accent)' }}
            data-testid={`notif-item-${n.id}`}
          >
            <span className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Bell size={16} />
            </span>
            <div className="flex-1">
              <div className="font-semibold flex items-center gap-2">{n.title}{!n.read && <span className="badge-red text-xs" style={{padding:'0.05rem 0.4rem'}}>NEW</span>}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{n.body}</div>
              <div className="text-xs mt-1 mono" style={{ color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <div className="flex gap-1">
              {!n.read && <button onClick={() => markRead(n.id)} className="p-2 rounded hover:bg-[var(--bg-alt)]" title="Mark read" data-testid={`notif-read-${n.id}`}><Check size={14} /></button>}
              <button onClick={() => setConfirm(n.id)} className="p-2 rounded" style={{ color: 'var(--accent)' }} data-testid={`notif-delete-${n.id}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!confirm} title="Delete notification?" onConfirm={del} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={confirmClear} title="Clear all notifications?" description="This will remove all notifications permanently." onConfirm={clearAll} onCancel={() => setConfirmClear(false)} />
    </div>
  );
};

export default NotificationsTab;
