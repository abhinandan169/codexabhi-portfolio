import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Edit3, Search } from 'lucide-react';
import { api, mediaUrl } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import FileUpload from './FileUpload';
import { StatusPill, AutoSaveStatus } from './StatusPill';
import { useAutoSave } from '@/lib/useAutoSave';
import { optimisticDelete } from '@/lib/optimisticDelete';

const empty = { name: '', organization: '', date: '', image: '', credential_link: '', order: 0, status: 'published' };

const CertificatesTab = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = () => api.get('/certificates').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const { status: autoStatus } = useAutoSave({
    value: form,
    enabled: !!editing,
    saveFn: (v) => api.put(`/admin/certificates/${editing}`, v),
  });

  const toggleStatus = async (c) => {
    const next = c.status === 'draft' ? 'published' : 'draft';
    try { await api.put(`/admin/certificates/${c.id}`, { status: next }); toast.success(next === 'draft' ? 'Moved to Draft' : 'Published'); load(); }
    catch { toast.error('Failed'); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/certificates/${editing}`, form);
      else await api.post('/admin/certificates', form);
      toast.success(editing ? 'Updated' : 'Created');
      setForm(empty); setEditing(null); load();
    } catch { toast.error('Save failed'); }
  };
  const edit = (c) => { setEditing(c.id); setForm({ ...empty, ...c }); };
  const cancel = () => { setEditing(null); setForm(empty); };
  const del = async () => { const id = confirm; setConfirm(null); await optimisticDelete({ id, url: `/admin/certificates/${id}`, items, setItems }); };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6" data-testid="certificates-tab">
      <div>
        <h1 className="text-2xl font-bold">Certificates</h1>
        <p className="text-sm text-[#555555]">Add unlimited certificates.</p>
      </div>

      <form onSubmit={save} className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="cert-form">
        <input className="input-x" placeholder="Certificate name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="cert-name-input" />
        <input className="input-x" placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} data-testid="cert-org-input" />
        <input className="input-x" placeholder="Date (e.g. 2024)" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="cert-date-input" />
        <input className="input-x" placeholder="Credential link" value={form.credential_link} onChange={(e) => setForm({ ...form, credential_link: e.target.value })} data-testid="cert-link-input" />
        <div className="md:col-span-2">
          <FileUpload value={form.image} onChange={(v) => setForm({ ...form, image: v })} label="Certificate Image" testId="cert-image-upload" />
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary" data-testid="cert-save-btn">{editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={cancel} className="btn-secondary" data-testid="cert-cancel-btn">Cancel</button>}
        </div>
        <div className="md:col-span-2 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
          <StatusPill status={form.status} onChange={(v) => setForm({ ...form, status: v })} testId="cert-status-toggle" />
          {editing && <AutoSaveStatus status={autoStatus} testId="cert-autosave" />}
        </div>
      </form>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
        <input className="input-x pl-10" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="cert-search" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="cert-list">
        {filtered.map((c) => (
          <div key={c.id} className="card-soft overflow-hidden" data-testid={`cert-item-${c.id}`}>
            <div className="aspect-video bg-[#FAFAFA] flex items-center justify-center">
              {c.image ? <img src={mediaUrl(c.image)} alt="" loading="lazy" className="w-full h-full object-cover" /> : <span className="text-[#E53935] text-4xl font-bold">{c.name[0]}</span>}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm flex-1 min-w-0 break-words">{c.name}</h3>
                <StatusPill status={c.status || 'published'} asBadge testId={`cert-badge-${c.id}`} />
              </div>
              <p className="text-xs text-[#555555] break-words">{c.organization} · {c.date}</p>
              <div className="mt-3 flex gap-1 items-center justify-end flex-wrap">
                <StatusPill status={c.status || 'published'} size="sm" onChange={() => toggleStatus(c)} testId={`cert-status-btn-${c.id}`} />
                <button onClick={() => edit(c)} className="p-2 hover:bg-[#FAFAFA] rounded flex-shrink-0" data-testid={`cert-edit-${c.id}`}><Edit3 size={14} /></button>
                <button onClick={() => setConfirm(c.id)} className="p-2 hover:bg-[#FFEBEE] text-[#E53935] rounded flex-shrink-0" data-testid={`cert-delete-${c.id}`}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!confirm} title="Delete certificate?" onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default CertificatesTab;
