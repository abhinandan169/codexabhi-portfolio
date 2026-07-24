import React, { useEffect, useState } from 'react';
import { Save, Loader2, Search, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import FileUpload from './FileUpload';

const SEOTab = () => {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/seo').then((r) => setS(r.data || {})); }, []);

  const set = (k) => (e) => setS({ ...s, [k]: e.target?.value ?? e });

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/seo', s);
      // Update document title live
      if (s.meta_title) document.title = s.meta_title;
      toast.success('SEO settings saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (!s) return <div>Loading...</div>;

  const Field = ({ label, k, area, testId, placeholder }) => (
    <div>
      <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {area ? (
        <textarea rows={3} className="input-x resize-none" value={s[k] || ''} onChange={set(k)} placeholder={placeholder} data-testid={testId} />
      ) : (
        <input className="input-x" value={s[k] || ''} onChange={set(k)} placeholder={placeholder} data-testid={testId} />
      )}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="seo-tab">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Search size={22} /> SEO Manager</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Everything search engines and social platforms see about your site.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary" data-testid="seo-save-btn">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      <div className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Website Title" k="site_title" testId="seo-site-title" />
        <Field label="Meta Title" k="meta_title" testId="seo-meta-title" />
        <div className="md:col-span-2"><Field label="Meta Description" k="meta_description" area testId="seo-meta-desc" /></div>
        <div className="md:col-span-2"><Field label="Keywords (comma separated)" k="keywords" testId="seo-keywords" /></div>
        <Field label="Canonical URL" k="canonical_url" testId="seo-canonical" placeholder="https://yourdomain.com" />
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Twitter Card</label>
          <select className="input-x" value={s.twitter_card || 'summary_large_image'} onChange={set('twitter_card')} data-testid="seo-twitter-card">
            <option value="summary">Summary</option>
            <option value="summary_large_image">Summary Large Image</option>
          </select>
        </div>
      </div>

      <div className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <h3 className="md:col-span-2 font-bold flex items-center gap-2"><Globe size={16} /> Open Graph</h3>
        <Field label="OG Title" k="og_title" testId="seo-og-title" />
        <div><label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>OG Image</label>
          <FileUpload value={s.og_image} onChange={(v) => setS({ ...s, og_image: v })} testId="seo-og-image-upload" label="" />
        </div>
        <div className="md:col-span-2"><Field label="OG Description" k="og_description" area testId="seo-og-desc" /></div>
      </div>

      <div className="card-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <h3 className="md:col-span-2 font-bold">Verification & Robots</h3>
        <Field label="Google Verification Code" k="google_verification" testId="seo-google-verify" />
        <Field label="Bing Verification Code" k="bing_verification" testId="seo-bing-verify" />
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Robots Directive</label>
          <select className="input-x" value={s.robots || 'index, follow'} onChange={set('robots')} data-testid="seo-robots">
            <option value="index, follow">index, follow</option>
            <option value="noindex, nofollow">noindex, nofollow</option>
            <option value="index, nofollow">index, nofollow</option>
            <option value="noindex, follow">noindex, follow</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Favicon</label>
          <FileUpload value={s.favicon} onChange={(v) => setS({ ...s, favicon: v })} testId="seo-favicon-upload" label="" accept="image/x-icon,image/png,image/svg+xml,.ico,.png,.svg" />
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Favicon supports <span className="mono">.ico, .png, .svg</span>. Public endpoints: <span className="mono">/api/robots.txt</span> · <span className="mono">/api/sitemap.xml</span>
      </p>
    </div>
  );
};

export default SEOTab;
