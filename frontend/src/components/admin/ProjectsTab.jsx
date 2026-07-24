import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Edit3, Search, Star, X, Pin, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import { api, mediaUrl } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import FileUpload from './FileUpload';
import { StatusPill, AutoSaveStatus } from './StatusPill';
import { useAutoSave } from '@/lib/useAutoSave';

const CATEGORIES = ['All', 'Python', 'Java', 'C++', 'React', 'Next.js', 'Frontend', 'Backend', 'Full Stack', 'AI', 'Machine Learning', 'Data Science', 'Database', 'API', 'Mobile', 'Other'];

const empty = { title: '', description: '', technologies: [], github_link: '', live_demo: '', cover_image: '', screenshots: [], featured: false, pinned: false, hidden: false, category: 'Other', order: 0, status: 'published' };

const ProjectsTab = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest'); // newest | oldest | alpha | featured
  const [visibility, setVisibility] = useState('all'); // all | visible | hidden
  const [confirm, setConfirm] = useState(null);
  const [techInput, setTechInput] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const load = () => api.get('/projects').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const { status: autoStatus } = useAutoSave({
    value: form,
    enabled: !!editing,
    saveFn: (v) => api.put(`/admin/projects/${editing}`, v),
  });

  const toggleStatus = async (row) => {
    const next = row.status === 'draft' ? 'published' : 'draft';
    try { await api.put(`/admin/projects/${row.id}`, { status: next }); toast.success(next === 'draft' ? 'Moved to Draft' : 'Published'); load(); }
    catch { toast.error('Failed'); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error('Title is required'); return; }
    try {
      const payload = { ...form };
      if (editing) await api.put(`/admin/projects/${editing}`, payload);
      else await api.post('/admin/projects', payload);
      toast.success(editing ? 'Updated' : 'Created');
      setForm(empty); setEditing(null); setTechInput('');
      load();
    } catch { toast.error('Save failed'); }
  };

  const edit = (p) => { setEditing(p.id); setForm({ ...empty, ...p }); setTechInput((p.technologies || []).join(', ')); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancel = () => { setEditing(null); setForm(empty); setTechInput(''); };

  const del = async () => { await api.delete(`/admin/projects/${confirm}`); toast.success('Deleted'); setConfirm(null); load(); };

  const bulkDelete = async () => {
    try {
      await api.post('/admin/projects/bulk-delete', { ids: Array.from(selected) });
      toast.success(`Deleted ${selected.size} projects`);
      setSelected(new Set()); setBulkConfirm(false); load();
    } catch { toast.error('Bulk delete failed'); }
  };

  const toggleSelect = (id) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const filtered = useMemo(() => {
    let list = items;
    if (q) list = list.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()) || (i.description || '').toLowerCase().includes(q.toLowerCase()));
    if (category !== 'All') list = list.filter((i) => (i.category || 'Other') === category);
    if (visibility === 'visible') list = list.filter((i) => !i.hidden);
    if (visibility === 'hidden') list = list.filter((i) => i.hidden);
    const sorted = [...list];
    if (sort === 'newest') sorted.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    else if (sort === 'oldest') sorted.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    else if (sort === 'alpha') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'featured') sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return sorted;
  }, [items, q, category, sort, visibility]);

  return (
    <div className="space-y-6" data-testid="projects-tab">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage projects with categories, pinning, and visibility.</p>
      </div>

      <form onSubmit={save} className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="project-form">
        <input className="input-x md:col-span-2" placeholder="Project title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="project-title-input" />
        <textarea rows={3} className="input-x md:col-span-2 resize-none" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="project-desc-input" />
        <input className="input-x" placeholder="GitHub link" value={form.github_link} onChange={(e) => setForm({ ...form, github_link: e.target.value })} data-testid="project-github-input" />
        <input className="input-x" placeholder="Live demo URL" value={form.live_demo} onChange={(e) => setForm({ ...form, live_demo: e.target.value })} data-testid="project-demo-input" />
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category</label>
          <select className="input-x" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="project-category-input">
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <input className="input-x" placeholder="Technologies (comma separated)" value={techInput}
          onChange={(e) => { setTechInput(e.target.value); setForm({ ...form, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }); }}
          data-testid="project-tech-input" />
        <div className="md:col-span-2">
          <FileUpload value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} label="Cover Image" testId="project-cover-upload" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Screenshots</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.screenshots?.map((s, i) => (
              <div key={i} className="relative">
                <img src={mediaUrl(s)} alt="" loading="lazy" className="w-20 h-20 object-cover rounded-lg border" style={{ borderColor: 'var(--border)' }} />
                <button type="button" onClick={() => setForm({ ...form, screenshots: form.screenshots.filter((_, j) => j !== i) })} className="absolute -top-2 -right-2 text-white rounded-full p-0.5" style={{ backgroundColor: 'var(--accent)' }} data-testid={`project-screenshot-remove-${i}`}><X size={12} /></button>
              </div>
            ))}
          </div>
          <FileUpload value="" onChange={(v) => setForm({ ...form, screenshots: [...(form.screenshots || []), v] })} label="" testId="project-screenshot-upload" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="project-featured-toggle" />
          <span className="flex items-center gap-1 text-sm font-semibold"><Star size={14} style={{ color: 'var(--accent)' }} /> Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} data-testid="project-pinned-toggle" />
          <span className="flex items-center gap-1 text-sm font-semibold"><Pin size={14} style={{ color: 'var(--accent)' }} /> Pinned</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer md:col-span-2">
          <input type="checkbox" checked={form.hidden} onChange={(e) => setForm({ ...form, hidden: e.target.checked })} data-testid="project-hidden-toggle" />
          <span className="flex items-center gap-1 text-sm font-semibold"><EyeOff size={14} /> Hide from public site</span>
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary" data-testid="project-save-btn">
            {editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Update Project' : 'Add Project'}
          </button>
          {editing && <button type="button" onClick={cancel} className="btn-secondary" data-testid="project-cancel-btn">Cancel</button>}
        </div>
        <div className="md:col-span-2 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
          <StatusPill status={form.status} onChange={(v) => setForm({ ...form, status: v })} testId="project-status-toggle" />
          {editing && <AutoSaveStatus status={autoStatus} testId="project-autosave" />}
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
          <input className="input-x pl-10" placeholder="Search projects..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="projects-search" />
        </div>
        <select className="input-x max-w-[10rem]" value={category} onChange={(e) => setCategory(e.target.value)} data-testid="projects-filter-category">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input-x max-w-[8rem]" value={sort} onChange={(e) => setSort(e.target.value)} data-testid="projects-filter-sort">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="alpha">A → Z</option>
          <option value="featured">Featured</option>
        </select>
        <select className="input-x max-w-[8rem]" value={visibility} onChange={(e) => setVisibility(e.target.value)} data-testid="projects-filter-visibility">
          <option value="all">All</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        {selected.size > 0 && (
          <button onClick={() => setBulkConfirm(true)} className="btn-primary text-sm" data-testid="projects-bulk-delete">
            <Trash2 size={14} /> Delete {selected.size}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="projects-list">
        {filtered.map((p) => (
          <div key={p.id} className={`card-soft overflow-hidden relative ${selected.has(p.id) ? 'ring-2' : ''}`} style={selected.has(p.id) ? { boxShadow: '0 0 0 2px var(--accent)' } : {}} data-testid={`project-item-${p.id}`}>
            <button onClick={() => toggleSelect(p.id)} className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur rounded p-1" data-testid={`project-select-${p.id}`}>
              {selected.has(p.id) ? <CheckSquare size={16} style={{ color: 'var(--accent)' }} /> : <Square size={16} />}
            </button>
            <div className="aspect-video" style={{ backgroundColor: 'var(--bg-alt)' }}>
              {p.cover_image ? <img src={mediaUrl(p.cover_image)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold" style={{ color: 'var(--accent)' }}>{p.title?.[0]}</div>}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold truncate">{p.title}</h3>
                <div className="flex items-center gap-1">
                  {p.pinned && <Pin size={12} style={{ color: 'var(--accent)' }} />}
                  {p.featured && <Star size={12} style={{ color: 'var(--accent)' }} fill="currentColor" />}
                  {p.hidden && <EyeOff size={12} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full mono" style={{ backgroundColor: 'var(--bg-alt)', color: 'var(--text-secondary)' }}>{p.category || 'Other'}</span>
                <StatusPill status={p.status || 'published'} asBadge testId={`project-badge-${p.id}`} />
              </div>
              <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
              <div className="mt-3 flex gap-1 items-center justify-end flex-wrap">
                <StatusPill status={p.status || 'published'} size="sm" onChange={() => toggleStatus(p)} testId={`project-status-btn-${p.id}`} />
                <button onClick={() => edit(p)} className="p-2 rounded hover:bg-[var(--bg-alt)]" data-testid={`project-edit-${p.id}`}><Edit3 size={14} /></button>
                <button onClick={() => setConfirm(p.id)} className="p-2 rounded" style={{ color: 'var(--accent)' }} data-testid={`project-delete-${p.id}`}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center py-12" style={{ color: 'var(--text-muted)' }}>No projects match your filters.</p>}
      </div>

      <ConfirmDialog open={!!confirm} title="Delete project?" onConfirm={del} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={bulkConfirm} title={`Delete ${selected.size} projects?`} description="This cannot be undone." onConfirm={bulkDelete} onCancel={() => setBulkConfirm(false)} />
    </div>
  );
};

export default ProjectsTab;
