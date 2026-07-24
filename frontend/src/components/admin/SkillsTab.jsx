import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Edit3, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import { StatusPill, AutoSaveStatus } from './StatusPill';
import { useAutoSave } from '@/lib/useAutoSave';

const empty = { name: '', level: 80, category: 'General', order: 0, status: 'published' };

const SkillsTab = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = () => api.get('/skills').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const { status: autoStatus } = useAutoSave({
    value: form,
    enabled: !!editing,
    saveFn: (v) => api.put(`/admin/skills/${editing}`, v),
  });

  const save = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    try {
      if (editing) await api.put(`/admin/skills/${editing}`, form);
      else await api.post('/admin/skills', form);
      toast.success(editing ? 'Updated' : 'Created');
      setForm(empty); setEditing(null);
      load();
    } catch { toast.error('Failed'); }
  };

  const edit = (s) => { setEditing(s.id); setForm({ ...empty, ...s }); };

  const toggleStatus = async (s) => {
    const next = s.status === 'draft' ? 'published' : 'draft';
    try {
      await api.put(`/admin/skills/${s.id}`, { status: next });
      toast.success(next === 'draft' ? 'Moved to Draft' : 'Published');
      load();
    } catch { toast.error('Failed'); }
  };

  const del = async () => {
    try {
      await api.delete(`/admin/skills/${confirm}`);
      toast.success('Deleted');
      setConfirm(null);
      load();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6" data-testid="skills-tab">
      <div>
        <h1 className="text-2xl font-bold">Skills</h1>
        <p className="text-sm text-[#555555]">Add unlimited skills with animated progress bars.</p>
      </div>

      <form onSubmit={save} className="card-soft p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end" data-testid="skill-form">
        <div className="sm:col-span-2">
          <label className="text-xs uppercase font-semibold text-[#555555]">Name *</label>
          <input className="input-x mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="skill-name-input" />
        </div>
        <div>
          <label className="text-xs uppercase font-semibold text-[#555555]">Level %</label>
          <input type="number" min={0} max={100} className="input-x mt-1" value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} data-testid="skill-level-input" />
        </div>
        <div>
          <label className="text-xs uppercase font-semibold text-[#555555]">Category</label>
          <input className="input-x mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="skill-category-input" />
        </div>
        <div className="flex gap-2 items-center">
          <button type="submit" className="btn-primary justify-center flex-1" data-testid="skill-save-btn">
            {editing ? <Save size={16} /> : <Plus size={16} />}
            {editing ? 'Update' : 'Add'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="btn-secondary" data-testid="skill-cancel-btn">Cancel</button>}
        </div>
        <div className="sm:col-span-5 flex items-center justify-between border-t pt-3 mt-1" style={{ borderColor: 'var(--border-soft)' }}>
          <StatusPill status={form.status} onChange={(v) => setForm({ ...form, status: v })} testId="skill-status-toggle" />
          {editing && <AutoSaveStatus status={autoStatus} testId="skill-autosave" />}
        </div>
      </form>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
          <input className="input-x pl-10" placeholder="Search skills..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="skills-search" />
        </div>
      </div>

      <div className="card-soft overflow-hidden" data-testid="skills-list">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
              <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Category</th><th className="text-left p-3">Level</th><th className="text-right p-3">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#F3F4F6]" data-testid={`skill-row-${s.id}`}>
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      <StatusPill status={s.status || 'published'} asBadge testId={`skill-badge-${s.id}`} />
                    </div>
                  </td>
                  <td className="p-3 text-[#555555]">{s.category}</td>
                  <td className="p-3 text-[#E53935] font-semibold mono">{s.level}%</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <StatusPill status={s.status || 'published'} size="sm" onChange={() => toggleStatus(s)} testId={`skill-status-btn-${s.id}`} />
                    <button onClick={() => edit(s)} className="p-2 hover:bg-[#FAFAFA] rounded ml-1" data-testid={`skill-edit-${s.id}`}><Edit3 size={14} /></button>
                    <button onClick={() => setConfirm(s.id)} className="p-2 hover:bg-[#FFEBEE] text-[#E53935] rounded" data-testid={`skill-delete-${s.id}`}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[#888888]">No skills.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog open={!!confirm} title="Delete skill?" onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default SkillsTab;
