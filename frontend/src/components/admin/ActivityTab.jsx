import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Activity as ActivityIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

const ActivityTab = () => {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 30 });
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = async () => {
    const r = await api.get('/admin/activity', { params: { page, page_size: 30 } });
    setData(r.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const clearAll = async () => {
    await api.delete('/admin/activity');
    setConfirmClear(false);
    toast.success('Activity log cleared');
    load();
  };

  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size));

  return (
    <div className="space-y-6" data-testid="activity-tab">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Track everything happening in your dashboard. Newest first.</p>
        </div>
        {data.total > 0 && (
          <button onClick={() => setConfirmClear(true)} className="btn-secondary" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} data-testid="activity-clear-btn">
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      <div className="card-soft overflow-hidden" data-testid="activity-list">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead style={{ backgroundColor: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Details</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => {
                const d = new Date(r.created_at);
                return (
                  <tr key={r.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }} data-testid={`activity-row-${r.id}`}>
                    <td className="p-3 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-[#FFEBEE] text-[#E53935] flex items-center justify-center flex-shrink-0"><ActivityIcon size={14} /></span>
                        {r.action}
                      </div>
                    </td>
                    <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{r.details || '—'}</td>
                    <td className="p-3 mono whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{d.toLocaleDateString()}</td>
                    <td className="p-3 mono whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{d.toLocaleTimeString()}</td>
                  </tr>
                );
              })}
              {data.items.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2" data-testid="activity-pagination">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-50" data-testid="activity-prev"><ChevronLeft size={16} /></button>
          <span className="text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary disabled:opacity-50" data-testid="activity-next"><ChevronRight size={16} /></button>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear all activity logs?"
        description="This will delete every activity record. This cannot be undone."
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
};

export default ActivityTab;
