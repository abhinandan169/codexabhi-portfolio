import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Edit3 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

const empty = { platform: '', url: '', order: 0 };

const SocialTab = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => api.get('/social-links').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/social-links/${editing}`, form);
      else await api.post('/admin/social-links', form);
      toast.success('Saved');
      setForm(empty); setEditing(null); load();
    } catch { toast.error('Failed'); }
  };
  const edit = (s) => { setEditing(s.id); setForm({ ...empty, ...s }); };
  const del = async () => { await api.delete(`/admin/social-links/${confirm}`); setConfirm(null); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-6" data-testid="social-tab">
      <div>
        <h1 className="text-2xl font-bold">Social Links</h1>
        <p className="text-sm text-[#555555]">Platforms: github, linkedin, twitter, whatsapp, email, instagram, etc.</p>
      </div>

      <form onSubmit={save} className="card-soft p-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end" data-testid="social-form">
        <input className="input-x" placeholder="Platform (e.g. github)" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} required data-testid="social-platform-input" />
        <input className="input-x md:col-span-2" placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required data-testid="social-url-input" />
        <div className="md:col-span-3 flex gap-2">
          <button className="btn-primary" data-testid="social-save-btn">{editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="btn-secondary">Cancel</button>}
        </div>
      </form>

      <div className="card-soft overflow-hidden" data-testid="social-list">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
              <tr><th className="text-left p-3">Platform</th><th className="text-left p-3">URL</th><th className="text-right p-3">Actions</th></tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-[#F3F4F6]" data-testid={`social-row-${s.id}`}>
                  <td className="p-3 font-medium capitalize whitespace-nowrap">{s.platform}</td>
                  <td className="p-3 text-[#555555] truncate max-w-[220px] sm:max-w-md">{s.url}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => edit(s)} className="p-2 hover:bg-[#FAFAFA] rounded" data-testid={`social-edit-${s.id}`}><Edit3 size={14} /></button>
                    <button onClick={() => setConfirm(s.id)} className="p-2 hover:bg-[#FFEBEE] text-[#E53935] rounded" data-testid={`social-delete-${s.id}`}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog open={!!confirm} title="Delete link?" onConfirm={del} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default SocialTab;
