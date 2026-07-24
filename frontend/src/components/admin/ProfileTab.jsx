import React, { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import FileUpload from './FileUpload';

const ProfileTab = () => {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingStr, setTypingStr] = useState('');

  useEffect(() => {
    api.get('/profile').then((r) => {
      setP(r.data);
      setTypingStr((r.data.typing_texts || []).join(', '));
    });
  }, []);

  if (!p) return <div>Loading...</div>;

  const save = async () => {
    setLoading(true);
    try {
      const payload = { ...p, typing_texts: typingStr.split(',').map(s => s.trim()).filter(Boolean) };
      delete payload._id;
      await api.put('/admin/profile', payload);
      toast.success('Profile saved');
    } catch { toast.error('Save failed'); }
    finally { setLoading(false); }
  };

  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });

  return (
    <div className="space-y-6" data-testid="profile-tab">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile & Hero</h1>
          <p className="text-sm text-[#555555]">Manage your personal information shown across the site.</p>
        </div>
        <button onClick={save} disabled={loading} className="btn-primary" data-testid="profile-save-btn">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      <div className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <FileUpload value={p.profile_image} onChange={(v) => setP({ ...p, profile_image: v })} label="Profile Image" testId="profile-image-upload" />
        </div>
        <div className="md:col-span-2">
          <FileUpload value={p.logo} onChange={(v) => setP({ ...p, logo: v })} label="Website Logo (PNG, SVG, WebP)" testId="profile-logo-upload" accept="image/png,image/svg+xml,image/webp,image/*" />
        </div>
        <Field label="Name" value={p.name} onChange={set('name')} testId="profile-name" />
        <Field label="Title" value={p.title} onChange={set('title')} testId="profile-title" />
        <Field label="Email" value={p.email} onChange={set('email')} testId="profile-email" />
        <Field label="Phone" value={p.phone} onChange={set('phone')} testId="profile-phone" />
        <Field label="Location" value={p.location} onChange={set('location')} testId="profile-location" />
        <Field label="Tagline" value={p.tagline} onChange={set('tagline')} testId="profile-tagline" />
        <Field label="GitHub Username (for stats & calendar)" value={p.github_username} onChange={set('github_username')} testId="profile-github-username" />
        <Field label="Typing texts (comma separated)" value={typingStr} onChange={(e) => setTypingStr(e.target.value)} testId="profile-typing" wide />
        <FieldArea label="Hero Intro (short)" value={p.intro} onChange={set('intro')} testId="profile-intro" />
        <FieldArea label="About Me (longer)" value={p.about} onChange={set('about')} testId="profile-about" />
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, testId, wide }) => (
  <div className={wide ? 'md:col-span-2' : ''}>
    <label className="text-xs uppercase tracking-widest font-semibold text-[#555555] block mb-1.5">{label}</label>
    <input className="input-x" value={value || ''} onChange={onChange} data-testid={testId} />
  </div>
);
const FieldArea = ({ label, value, onChange, testId }) => (
  <div className="md:col-span-2">
    <label className="text-xs uppercase tracking-widest font-semibold text-[#555555] block mb-1.5">{label}</label>
    <textarea rows={4} className="input-x resize-none" value={value || ''} onChange={onChange} data-testid={testId} />
  </div>
);

export default ProfileTab;
