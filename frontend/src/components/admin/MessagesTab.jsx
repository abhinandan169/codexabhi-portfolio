import React, { useEffect, useState } from 'react';
import { Trash2, Search, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

const MessagesTab = () => {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 });
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [page, setPage] = useState(1);

  const load = async () => {
    const r = await api.get('/admin/messages', { params: { q, page, page_size: 10 } });
    setData(r.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, q]);

  const del = async () => { await api.delete(`/admin/messages/${confirm}`); setConfirm(null); toast.success('Deleted'); load(); };
  const markRead = async (id) => { await api.put(`/admin/messages/${id}/read`); load(); };

  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size));

  return (
    <div className="space-y-6" data-testid="messages-tab">
      <div>
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <p className="text-sm text-[#555555]">Total: {data.total}</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
        <input className="input-x pl-10" placeholder="Search messages..." value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} data-testid="messages-search" />
      </div>

      <div className="space-y-3" data-testid="messages-list">
        {data.items.map((m) => (
          <div key={m.id} className={`card-soft p-5 ${m.read ? '' : 'border-l-4 border-l-[#E53935]'}`} data-testid={`message-${m.id}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{m.name}</h3>
                  {!m.read && <span className="badge-red text-xs" style={{padding:'0.1rem 0.5rem'}}>New</span>}
                </div>
                <p className="text-xs text-[#888888] mt-1">{m.email} · {new Date(m.created_at).toLocaleString()}</p>
                {m.subject && <p className="text-sm font-semibold mt-2">{m.subject}</p>}
                <p className="text-sm text-[#555555] mt-2 whitespace-pre-wrap">{m.message}</p>
              </div>
              <div className="flex gap-1">
                {!m.read && <button onClick={() => markRead(m.id)} className="p-2 hover:bg-[#FAFAFA] rounded" title="Mark read" data-testid={`message-read-${m.id}`}><Check size={14} /></button>}
                <button onClick={() => setConfirm(m.id)} className="p-2 hover:bg-[#FFEBEE] text-[#E53935] rounded" data-testid={`message-delete-${m.id}`}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {data.items.length === 0 && <p className="text-center text-[#888888] py-8">No messages.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2" data-testid="messages-pagination">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-50" data-testid="messages-prev"><ChevronLeft size={16} /></button>
          <span className="text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary disabled:opacity-50" data-testid="messages-next"><ChevronRight size={16} /></button>
        </div>
      )}

      <ConfirmDialog open={!!confirm} title="Delete message?" onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default MessagesTab;
