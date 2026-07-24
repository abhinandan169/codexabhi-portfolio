import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Edit3 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import { StatusPill, AutoSaveStatus } from './StatusPill';
import { useAutoSave } from '@/lib/useAutoSave';

const empty = { degree: '', college: '', university: '', cgpa: '', passing_year: '', order: 0, status: 'published' };

const EducationTab = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => api.get('/education').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const { status: autoStatus } = useAutoSave({
    value: form,
    enabled: !!editing,
    saveFn: (v) => api.put(`/admin/education/${editing}`, v),
  });

  const toggleStatus = async (row) => {
    const next = row.status === 'draft' ? 'published' : 'draft';
    try { await api.put(`/admin/education/${row.id}`, { status: next }); toast.success(next === 'draft' ? 'Moved to Draft' : 'Published'); load(); }
    catch { toast.error('Failed'); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/education/${editing}`, form);
      else await api.post('/admin/education', form);
      toast.success(editing ? 'Updated' : 'Created');
      setForm(empty); setEditing(null); load();
    } catch { toast.error('Save failed'); }
  };
  const edit = (e) => { setEditing(e.id); setForm({ ...empty, ...e }); };
  const del = async () => { await api.delete(`/admin/education/${confirm}`); setConfirm(null); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-6" data-testid="education-tab">
      <div>
        <h1 className="text-2xl font-bold">Education</h1>
      </div>

      <form onSubmit={save} className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="edu-form">
        <input className="input-x" placeholder="Degree" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} required data-testid="edu-degree-input" />
        <input className="input-x" placeholder="Passing Year" value={form.passing_year} onChange={(e) => setForm({ ...form, passing_year: e.target.value })} data-testid="edu-year-input" />
        <input className="input-x" placeholder="College" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} data-testid="edu-college-input" />
        <input className="input-x" placeholder="University" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} data-testid="edu-university-input" />
        <input className="input-x" placeholder="CGPA / Percentage" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} data-testid="edu-cgpa-input" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" data-testid="edu-save-btn">{editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="btn-secondary">Cancel</button>}
        </div>
        <div className="md:col-span-2 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
          <StatusPill status={form.status} onChange={(v) => setForm({ ...form, status: v })} testId="edu-status-toggle" />
          {editing && <AutoSaveStatus status={autoStatus} testId="edu-autosave" />}
        </div>
      </form>

      <div className="space-y-3" data-testid="edu-list">
        {items.map((e) => (
          <div key={e.id} className="card-soft p-4 flex items-center justify-between" data-testid={`edu-item-${e.id}`}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{e.degree}</h3>
                <StatusPill status={e.status || 'published'} asBadge testId={`edu-badge-${e.id}`} />
              </div>
              <p className="text-sm text-[#555555]">{e.college} · {e.university}</p>
              <p className="text-xs text-[#888888] mt-1 mono">{e.passing_year} · CGPA {e.cgpa}</p>
            </div>
            <div className="flex gap-1 items-center flex-wrap justify-end">
              <StatusPill status={e.status || 'published'} size="sm" onChange={() => toggleStatus(e)} testId={`edu-status-btn-${e.id}`} />
              <button onClick={() => edit(e)} className="p-2 hover:bg-[#FAFAFA] rounded" data-testid={`edu-edit-${e.id}`}><Edit3 size={14} /></button>
              <button onClick={() => setConfirm(e.id)} className="p-2 hover:bg-[#FFEBEE] text-[#E53935] rounded" data-testid={`edu-delete-${e.id}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!confirm} title="Delete entry?" onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default EducationTab;
