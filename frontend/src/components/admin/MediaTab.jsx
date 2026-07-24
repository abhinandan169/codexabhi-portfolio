import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Copy, Grid3x3, List, Search, Loader2, UploadCloud, HardDrive } from 'lucide-react';
import { api, mediaUrl } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

const bytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
};

const MediaTab = () => {
  const [data, setData] = useState({ items: [], total_size: 0, count: 0 });
  const [q, setQ] = useState('');
  const [view, setView] = useState('grid');
  const [confirm, setConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const load = () => api.get('/admin/media', { params: q ? { q } : {} }).then((r) => setData(r.data));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  const doUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', f);
        await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(`${files.length} file(s) uploaded`);
      load();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const del = async () => {
    if (!confirm) return;
    try {
      await api.delete(`/admin/media/${confirm}`);
      toast.success('Deleted');
      setConfirm(null);
      load();
    } catch { toast.error('Delete failed'); }
  };

  const copyUrl = async (url) => {
    await navigator.clipboard.writeText(mediaUrl(url));
    toast.success('URL copied');
  };

  const rename = async (id) => {
    const item = data.items.find((i) => i.id === id);
    const name = window.prompt('New name', item?.filename || '');
    if (!name) return;
    await api.put(`/admin/media/${id}`, { filename: name });
    toast.success('Renamed');
    load();
  };

  return (
    <div className="space-y-6" data-testid="media-tab">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>All your uploaded media in one place.</p>
        </div>
        <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-alt)', color: 'var(--text-secondary)' }}>
          <HardDrive size={14} /> {data.count} items · {bytes(data.total_size)}
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); doUpload(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="card-soft border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
        style={{ borderColor: dragging ? 'var(--accent)' : 'var(--border)', backgroundColor: dragging ? 'var(--accent-light)' : 'var(--bg-alt)' }}
        data-testid="media-dropzone"
      >
        <input ref={inputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => doUpload(e.target.files)} />
        {uploading ? (
          <div className="inline-flex items-center gap-2" style={{ color: 'var(--accent)' }}><Loader2 className="animate-spin" size={18} /> Uploading...</div>
        ) : (
          <>
            <UploadCloud size={28} style={{ color: 'var(--accent)' }} className="mx-auto" />
            <div className="mt-2 font-semibold">Drag &amp; drop files here or click to upload</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Multiple files supported</div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
          <input className="input-x pl-10" placeholder="Search files..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="media-search" />
        </div>
        <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setView('grid')} className="p-2" style={{ backgroundColor: view === 'grid' ? 'var(--accent-light)' : 'transparent', color: view === 'grid' ? 'var(--accent)' : 'var(--text-secondary)' }} data-testid="media-view-grid"><Grid3x3 size={16} /></button>
          <button onClick={() => setView('list')} className="p-2" style={{ backgroundColor: view === 'list' ? 'var(--accent-light)' : 'transparent', color: view === 'list' ? 'var(--accent)' : 'var(--text-secondary)' }} data-testid="media-view-list"><List size={16} /></button>
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="text-center py-16" style={{ color: 'var(--text-muted)' }}>No files yet.</p>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" data-testid="media-grid">
          {data.items.map((m) => (
            <div key={m.id} className="card-soft p-2 group relative" data-testid={`media-item-${m.id}`}>
              <div className="aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-alt)' }}>
                {m.content_type?.startsWith('image') ? (
                  <img src={mediaUrl(m.url)} alt={m.filename} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--accent)' }}>PDF</div>
                )}
              </div>
              <div className="mt-2 text-xs truncate font-semibold" title={m.filename}>{m.filename}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{bytes(m.size)}</div>
              <div className="mt-2 flex items-center gap-1">
                <button onClick={() => copyUrl(m.url)} className="flex-1 p-1.5 rounded hover:bg-[var(--bg-alt)]" title="Copy URL" data-testid={`media-copy-${m.id}`}><Copy size={13} /></button>
                <button onClick={() => rename(m.id)} className="flex-1 p-1.5 rounded hover:bg-[var(--bg-alt)] text-xs" data-testid={`media-rename-${m.id}`}>Rename</button>
                <button onClick={() => setConfirm(m.id)} className="p-1.5 rounded hover:bg-[var(--accent-light)]" style={{ color: 'var(--accent)' }} data-testid={`media-delete-${m.id}`}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-soft overflow-hidden" data-testid="media-list">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
              <tr><th className="text-left p-3">Preview</th><th className="text-left p-3">Filename</th><th className="text-left p-3">Size</th><th className="text-left p-3">Date</th><th className="text-right p-3">Actions</th></tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr key={m.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
                  <td className="p-3"><div className="w-12 h-12 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-alt)' }}>
                    {m.content_type?.startsWith('image') ? <img src={mediaUrl(m.url)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--accent)' }}>PDF</div>}
                  </div></td>
                  <td className="p-3 font-medium truncate max-w-xs">{m.filename}</td>
                  <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{bytes(m.size)}</td>
                  <td className="p-3" style={{ color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => copyUrl(m.url)} className="p-1.5 rounded hover:bg-[var(--bg-alt)]"><Copy size={14} /></button>
                    <button onClick={() => setConfirm(m.id)} className="p-1.5 rounded" style={{ color: 'var(--accent)' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!confirm} title="Delete this file?" description="This will permanently remove the file from storage." onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default MediaTab;
