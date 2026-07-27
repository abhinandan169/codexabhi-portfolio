import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Edit3 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import { optimisticDelete } from '@/lib/optimisticDelete';

const empty = { label: '', value: 0, suffix: '+', icon: 'star', order: 0 };

const CountersTab = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => api.get('/counters').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.label?.trim()) { toast.error('Label is required'); return; }
    try {
      if (editing) await api.put(`/admin/counters/${editing}`, form);
      else await api.post('/admin/counters', form);
      toast.success('Saved');
      setForm(empty); setEditing(null); load();
    } catch { toast.error('Failed'); }
  };
  const edit = (c) => { setEditing(c.id); setForm({ ...empty, ...c }); };
  const cancel = () => { setEditing(null); setForm(empty); };
  const del = async () => { const id = confirm; setConfirm(null); await optimisticDelete({ id, url: `/admin/counters/${id}`, items, setItems }); };

  return (
    <div className="space-y-6" data-testid="counters-tab">
      <div>
        <h1 className="text-2xl font-bold">Achievement Counters</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Animated stat counters displayed on the homepage.</p>
      </div>

      <form onSubmit={save} className="card-soft p-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end" data-testid="counter-form">
        <input className="input-x md:col-span-2" placeholder="Label *" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required data-testid="counter-label" />
        <input className="input-x" type="number" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} data-testid="counter-value" />
        <input className="input-x" placeholder="Suffix (e.g. +)" value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} data-testid="counter-suffix" />
        <input className="input-x" placeholder="Icon (lucide name)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} data-testid="counter-icon" />
        <div className="md:col-span-5 flex gap-2">
          <button type="submit" className="btn-primary" data-testid="counter-save-btn">{editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={cancel} className="btn-secondary" data-testid="counter-cancel-btn">Cancel</button>}
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="counters-list">
        {items.map((c) => (
          <div key={c.id} className="card-soft p-5 flex items-center justify-between" data-testid={`counter-item-${c.id}`}>
            <div>
              <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{c.value}{c.suffix}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{c.label}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => edit(c)} className="p-2 rounded hover:bg-[var(--bg-alt)]" data-testid={`counter-edit-${c.id}`}><Edit3 size={14} /></button>
              <button onClick={() => setConfirm(c.id)} className="p-2 rounded" style={{ color: 'var(--accent)' }} data-testid={`counter-delete-${c.id}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!confirm} title="Delete counter?" onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default CountersTab;
