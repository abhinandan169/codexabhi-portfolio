import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Edit3, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import FileUpload from './FileUpload';
import { StatusPill, AutoSaveStatus } from './StatusPill';
import { useAutoSave } from '@/lib/useAutoSave';

const empty = { company: '', role: '', employment_type: 'Full-time', location: '', start_date: '', end_date: '', currently_working: false, description: '', technologies: [], company_logo: '', order: 0, featured: false, status: 'published' };

const ExperienceTab = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [techStr, setTechStr] = useState('');

  const load = () => api.get('/experience').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const { status: autoStatus } = useAutoSave({
    value: form,
    enabled: !!editing,
    saveFn: (v) => api.put(`/admin/experience/${editing}`, v),
  });

  const toggleStatus = async (row) => {
    const next = row.status === 'draft' ? 'published' : 'draft';
    try { await api.put(`/admin/experience/${row.id}`, { status: next }); toast.success(next === 'draft' ? 'Moved to Draft' : 'Published'); load(); }
    catch { toast.error('Failed'); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.company?.trim() || !form.role?.trim()) { toast.error('Company and Role are required'); return; }
    try {
      if (editing) await api.put(`/admin/experience/${editing}`, form);
      else await api.post('/admin/experience', form);
      toast.success(editing ? 'Updated' : 'Created');
      setForm(empty); setEditing(null); setTechStr(''); load();
    } catch { toast.error('Failed'); }
  };
  const edit = (x) => { setEditing(x.id); setForm({ ...empty, ...x }); setTechStr((x.technologies || []).join(', ')); };
  const cancel = () => { setEditing(null); setForm(empty); setTechStr(''); };
  const del = async () => { await api.delete(`/admin/experience/${confirm}`); setConfirm(null); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-6" data-testid="experience-tab">
      <div>
        <h1 className="text-2xl font-bold">Experience</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your professional journey and roles.</p>
      </div>

      <form onSubmit={save} className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="exp-form">
        <input className="input-x" placeholder="Company *" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required data-testid="exp-company" />
        <input className="input-x" placeholder="Role *" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required data-testid="exp-role" />
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Employment Type</label>
          <select className="input-x" value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} data-testid="exp-type">
            {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Volunteer'].map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
        <input className="input-x" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="exp-location" />
        <input className="input-x" placeholder="Start date (e.g. 2023)" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} data-testid="exp-start" />
        <input className="input-x" placeholder="End date (leave empty if current)" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} disabled={form.currently_working} data-testid="exp-end" />
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={form.currently_working} onChange={(e) => setForm({ ...form, currently_working: e.target.checked, end_date: e.target.checked ? '' : form.end_date })} data-testid="exp-current" />
          <span className="text-sm">Currently working here</span>
        </label>
        <textarea rows={3} className="input-x resize-none md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="exp-description" />
        <input className="input-x md:col-span-2" placeholder="Technologies (comma separated)" value={techStr}
          onChange={(e) => { setTechStr(e.target.value); setForm({ ...form, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }); }}
          data-testid="exp-tech" />
        <div className="md:col-span-2">
          <FileUpload value={form.company_logo} onChange={(v) => setForm({ ...form, company_logo: v })} label="Company Logo" testId="exp-logo-upload" />
        </div>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="exp-featured" />
          <span className="text-sm font-semibold flex items-center gap-1"><Star size={14} style={{ color: 'var(--accent)' }} /> Featured</span>
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary" data-testid="exp-save-btn">{editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={cancel} className="btn-secondary" data-testid="exp-cancel-btn">Cancel</button>}
        </div>
        <div className="md:col-span-2 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
          <StatusPill status={form.status} onChange={(v) => setForm({ ...form, status: v })} testId="exp-status-toggle" />
          {editing && <AutoSaveStatus status={autoStatus} testId="exp-autosave" />}
        </div>
      </form>

      <div className="space-y-3" data-testid="exp-list">
        {items.map((x) => (
          <div key={x.id} className="card-soft p-5 flex items-start justify-between gap-4" data-testid={`exp-item-${x.id}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold">{x.role}</h3>
                {x.featured && <Star size={12} fill="var(--accent)" style={{ color: 'var(--accent)' }} />}
                <StatusPill status={x.status || 'published'} asBadge testId={`exp-badge-${x.id}`} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{x.company} · {x.employment_type} · {x.location}</p>
              <p className="text-xs mt-1 mono" style={{ color: 'var(--text-muted)' }}>{x.start_date} — {x.currently_working ? 'Present' : x.end_date}</p>
            </div>
            <div className="flex gap-1 items-center flex-wrap justify-end">
              <StatusPill status={x.status || 'published'} size="sm" onChange={() => toggleStatus(x)} testId={`exp-status-btn-${x.id}`} />
              <button onClick={() => edit(x)} className="p-2 rounded hover:bg-[var(--bg-alt)]" data-testid={`exp-edit-${x.id}`}><Edit3 size={14} /></button>
              <button onClick={() => setConfirm(x.id)} className="p-2 rounded" style={{ color: 'var(--accent)' }} data-testid={`exp-delete-${x.id}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!confirm} title="Delete experience?" onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default ExperienceTab;
