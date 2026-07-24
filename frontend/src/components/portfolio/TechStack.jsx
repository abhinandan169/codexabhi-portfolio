import React, { useMemo } from 'react';
import * as Icons from 'lucide-react';

const iconFor = (category = '') => {
  const c = category.toLowerCase();
  if (c.includes('language')) return Icons.Code;
  if (c.includes('database')) return Icons.Database;
  if (c.includes('frontend') || c.includes('framework')) return Icons.Layout;
  if (c.includes('backend')) return Icons.Server;
  if (c.includes('cloud') || c.includes('devops')) return Icons.Cloud;
  if (c.includes('mobile')) return Icons.Smartphone;
  if (c.includes('ai') || c.includes('ml') || c.includes('data')) return Icons.BrainCircuit;
  if (c.includes('tool')) return Icons.Wrench;
  return Icons.Sparkles;
};

const TechStack = ({ skills }) => {
  const grouped = useMemo(() => {
    const g = {};
    (skills || []).forEach((s) => {
      const cat = s.category || 'General';
      (g[cat] = g[cat] || []).push(s);
    });
    return g;
  }, [skills]);

  if (!skills?.length) return null;

  return (
    <section className="section-y" data-testid="tech-stack-section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Tech Stack</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            My daily <span style={{ color: 'var(--accent)' }}>toolkit.</span>
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
            The languages, frameworks, and tools I reach for to ship reliably.
          </p>
        </div>

        <div className="mt-12 space-y-6" data-testid="tech-stack-groups">
          {Object.entries(grouped).map(([category, list]) => {
            const Ico = iconFor(category);
            return (
              <div key={category} className="card-soft p-6" data-testid={`tech-group-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                    <Ico size={18} />
                  </span>
                  <h3 className="font-bold text-lg">{category}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full mono" style={{ backgroundColor: 'var(--bg-alt)', color: 'var(--text-muted)' }}>{list.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-2 rounded-xl border text-sm font-semibold transition-transform hover:-translate-y-1 hover:shadow-md cursor-default"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-alt)', color: 'var(--text)' }}
                      data-testid={`tech-chip-${s.name.toLowerCase()}`}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TechStack;
