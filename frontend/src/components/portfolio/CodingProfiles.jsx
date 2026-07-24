import React from 'react';
import { ExternalLink } from 'lucide-react';
import { getSocialMeta } from '@/lib/socialIcons';

// Whitelist of platforms considered "coding profiles". Any social link whose
// platform matches one of these tokens (case-insensitive substring) is shown
// in this section. Others (LinkedIn, WhatsApp, etc.) render in Footer only.
const CODING_TOKENS = [
  'github', 'leetcode', 'hackerrank', 'hackerearth', 'codeforces', 'codechef',
  'geeksforgeeks', 'gfg', 'kaggle', 'stackoverflow', 'stack overflow',
  'gitlab', 'bitbucket',
];

const isCoding = (p) => {
  const k = (p || '').toLowerCase();
  return CODING_TOKENS.some((t) => k.includes(t));
};

const CodingProfiles = ({ social }) => {
  const platforms = (social || []).filter((s) => isCoding(s.platform));
  if (platforms.length === 0) return null;

  return (
    <section className="section-y" data-testid="coding-profiles-section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Coding Profiles</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            Find me across the <span style={{ color: 'var(--accent)' }}>coding world.</span>
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="coding-profiles-grid">
          {platforms.map((p) => {
            const meta = getSocialMeta(p.platform);
            const Ico = meta.icon;
            return (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="card-soft p-5 group relative overflow-hidden"
                data-testid={`coding-profile-${p.platform.toLowerCase()}`}
              >
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-30 transition-opacity"
                  style={{ backgroundColor: meta.color }}
                />
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: meta.color }}
                  >
                    <Ico size={22} />
                  </div>
                  <div className="mt-4 font-bold text-lg">{meta.label}</div>
                  <div className="mt-1 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {p.url.replace(/^https?:\/\//, '')}
                  </div>
                  <div
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
                    style={{ color: 'var(--accent)' }}
                  >
                    View profile <ExternalLink size={13} />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CodingProfiles;
