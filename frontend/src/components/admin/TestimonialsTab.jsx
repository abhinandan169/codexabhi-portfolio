import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Edit3, Star } from 'lucide-react';
import { api, mediaUrl } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import FileUpload from './FileUpload';
import { StatusPill, AutoSaveStatus } from './StatusPill';
import { useAutoSave } from '@/lib/useAutoSave';
import { optimisticDelete } from '@/lib/optimisticDelete';

const empty = { name: '', company: '', role: '', rating: 5, review: '', photo: '', linkedin: '', order: 0, featured: false, status: 'published' };

const TestimonialsTab = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => api.get('/testimonials').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const { status: autoStatus } = useAutoSave({
    value: form,
    enabled: !!editing,
    saveFn: (v) => api.put(`/admin/testimonials/${editing}`, v),
  });

  const toggleStatus = async (row) => {
    const next = row.status === 'draft' ? 'published' : 'draft';
    try { await api.put(`/admin/testimonials/${row.id}`, { status: next }); toast.success(next === 'draft' ? 'Moved to Draft' : 'Published'); load(); }
    catch { toast.error('Failed'); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.review?.trim()) { toast.error('Name and review are required'); return; }
    try {
      if (editing) await api.put(`/admin/testimonials/${editing}`, form);
      else await api.post('/admin/testimonials', form);
      toast.success(editing ? 'Updated' : 'Created');
      setForm(empty); setEditing(null); load();
    } catch { toast.error('Failed'); }
  };
  const edit = (t) => { setEditing(t.id); setForm({ ...empty, ...t }); };
  const cancel = () => { setEditing(null); setForm(empty); };
  const del = async () => { const id = confirm; setConfirm(null); await optimisticDelete({ id, url: `/admin/testimonials/${id}`, items, setItems }); };

  return (
    <div className="space-y-6" data-testid="testimonials-tab">
      <div>
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reviews from teammates, mentors, and clients.</p>
      </div>

      <form onSubmit={save} className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="testimonial-form">
        <input className="input-x" placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="testi-name" />
        <input className="input-x" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} data-testid="testi-company" />
        <input className="input-x" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} data-testid="testi-role" />
        <input className="input-x" placeholder="LinkedIn URL" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} data-testid="testi-linkedin" />
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Rating (1-5)</label>
          <input type="number" min={1} max={5} className="input-x" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} data-testid="testi-rating" />
        </div>
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Order</label>
          <input type="number" className="input-x" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} data-testid="testi-order" />
        </div>
        <textarea rows={3} className="input-x resize-none md:col-span-2" placeholder="Review *" value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} required data-testid="testi-review" />
        <div className="md:col-span-2">
          <FileUpload value={form.photo} onChange={(v) => setForm({ ...form, photo: v })} label="Photo" testId="testi-photo-upload" />
        </div>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="testi-featured" />
          <span className="text-sm font-semibold flex items-center gap-1"><Star size={14} style={{ color: 'var(--accent)' }} /> Featured</span>
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary" data-testid="testi-save-btn">{editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={cancel} className="btn-secondary" data-testid="testi-cancel-btn">Cancel</button>}
        </div>
        <div className="md:col-span-2 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
          <StatusPill status={form.status} onChange={(v) => setForm({ ...form, status: v })} testId="testi-status-toggle" />
          {editing && <AutoSaveStatus status={autoStatus} testId="testi-autosave" />}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="testimonials-list">
        {items.map((t) => (
          <div key={t.id} className="card-soft p-5" data-testid={`testi-item-${t.id}`}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-alt)' }}>
                {t.photo ? <img src={mediaUrl(t.photo)} alt="" loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold" style={{ color: 'var(--accent)' }}>{t.name?.[0]}</div>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">{t.name}</h3>
                  {t.featured && <Star size={12} fill="var(--accent)" style={{ color: 'var(--accent)' }} />}
                  <StatusPill status={t.status || 'published'} asBadge testId={`testi-badge-${t.id}`} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.role}{t.company ? ` @ ${t.company}` : ''}</p>
                <p className="text-sm mt-2 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{t.review}</p>
                <div className="flex mt-2 text-xs" style={{ color: 'var(--accent)' }}>{'★'.repeat(t.rating)}<span style={{ color: 'var(--text-muted)' }}>{'★'.repeat(5 - t.rating)}</span></div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <StatusPill status={t.status || 'published'} size="sm" onChange={() => toggleStatus(t)} testId={`testi-status-btn-${t.id}`} />
                <button onClick={() => edit(t)} className="p-2 rounded hover:bg-[var(--bg-alt)]" data-testid={`testi-edit-${t.id}`}><Edit3 size={14} /></button>
                <button onClick={() => setConfirm(t.id)} className="p-2 rounded" style={{ color: 'var(--accent)' }} data-testid={`testi-delete-${t.id}`}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!confirm} title="Delete testimonial?" onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default TestimonialsTab;
