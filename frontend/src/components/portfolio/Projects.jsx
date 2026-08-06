import React, { useMemo, useState } from 'react';
import { Github, ExternalLink, Star, ArrowRight, Filter } from 'lucide-react';
import { mediaUrl } from '@/lib/api';
import { trackProject } from '@/lib/analytics';

const ProjectCard = ({ p }) => (
  <div className="card-soft overflow-hidden flex flex-col h-full" data-testid={`project-card-${p.id}`}>
    <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: 'var(--bg-alt)' }}>
      {p.cover_image ? (
        <img src={mediaUrl(p.cover_image)} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-gradient-to-br from-[var(--accent-light)] to-[var(--bg)]" style={{ color: 'var(--accent)' }}>{p.title?.[0]}</div>
      )}
      {p.featured && (
        <span className="absolute top-3 left-3 badge-red flex items-center gap-1" data-testid="project-featured-badge">
          <Star size={12} fill="currentColor" /> Featured
        </span>
      )}
      {p.category && p.category !== 'Other' && (
        <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full backdrop-blur mono" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--text)' }}>{p.category}</span>
      )}
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <h3 className="text-lg font-bold mb-2">{p.title}</h3>
      <p className="prose-card" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
      {p.technologies?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {p.technologies.map((t, i) => (
            <span key={i} className="text-xs px-2.5 py-1 border rounded-full mono" style={{ backgroundColor: 'var(--bg-alt)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{t}</span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
        {p.github_link && (
          <a href={p.github_link} target="_blank" rel="noreferrer" onClick={() => trackProject(p.id)} className="transition-colors hover:opacity-70" style={{ color: 'var(--text-secondary)' }} data-testid={`project-github-${p.id}`}>
            <Github size={18} />
          </a>
        )}
        {p.live_demo && (
          <a href={p.live_demo} target="_blank" rel="noreferrer" onClick={() => trackProject(p.id)} className="transition-colors hover:opacity-70" style={{ color: 'var(--text-secondary)' }} data-testid={`project-demo-${p.id}`}>
            <ExternalLink size={18} />
          </a>
        )}
        <span className="flex-1"></span>
        {p.live_demo && (
          <a href={p.live_demo} target="_blank" rel="noreferrer" onClick={() => trackProject(p.id)} className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: 'var(--accent)' }}>
            View <ArrowRight size={14} />
          </a>
        )}
      </div>
    </div>
  </div>
);

const Projects = ({ projects }) => {
  const [filter, setFilter] = useState('All');

  // Available categories are those actually used in projects
  const categories = useMemo(() => {
    const cats = new Set(['All']);
    projects.forEach((p) => cats.add(p.category || 'Other'));
    return Array.from(cats);
  }, [projects]);

  const filtered = useMemo(() => {
    if (filter === 'All') return projects;
    return projects.filter((p) => (p.category || 'Other') === filter);
  }, [projects, filter]);

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <section id="projects" className="section-y" style={{ backgroundColor: 'var(--bg-alt)' }} data-testid="projects-section">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="eyebrow">Projects</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-2">
              Selected <span style={{ color: 'var(--accent)' }}>work.</span>
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>Filter by category to explore what interests you.</p>
          </div>
        </div>

        {categories.length > 2 && (
          <div className="mt-8 flex flex-wrap gap-2" data-testid="project-filter">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                data-testid={`filter-${c}`}
                className="px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all"
                style={{
                  borderColor: filter === c ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: filter === c ? 'var(--accent)' : 'transparent',
                  color: filter === c ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {featured && (
          <div className="mt-12" data-testid="featured-project">
            <div className="card-soft overflow-hidden grid grid-cols-1 lg:grid-cols-2">
              <div className="aspect-video lg:aspect-auto" style={{ backgroundColor: 'var(--bg-alt)' }}>
                {featured.cover_image ? (
                  <img src={mediaUrl(featured.cover_image)} alt={featured.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full min-h-[300px] flex items-center justify-center text-7xl font-bold bg-gradient-to-br from-[var(--accent-light)] to-[var(--bg)]" style={{ color: 'var(--accent)' }}>{featured.title?.[0]}</div>
                )}
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <span className="badge-red inline-flex items-center gap-1 self-start"><Star size={12} fill="currentColor" /> Featured Project</span>
                <h3 className="text-3xl font-bold mt-4">{featured.title}</h3>
                <p className="mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{featured.description}</p>
                {featured.technologies?.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {featured.technologies.map((t, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 border rounded-full mono" style={{ backgroundColor: 'var(--bg-alt)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-8 flex gap-3">
                  {featured.github_link && (
                    <a href={featured.github_link} target="_blank" rel="noreferrer" onClick={() => trackProject(featured.id)} className="btn-secondary" data-testid="featured-github-btn">
                      <Github size={16} /> Code
                    </a>
                  )}
                  {featured.live_demo && (
                    <a href={featured.live_demo} target="_blank" rel="noreferrer" onClick={() => trackProject(featured.id)} className="btn-primary" data-testid="featured-demo-btn">
                      <ExternalLink size={16} /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch" data-testid="projects-grid">
          {rest.map((p) => <ProjectCard key={p.id} p={p} />)}
          {filtered.length === 0 && <p className="col-span-full text-center" style={{ color: 'var(--text-muted)' }}>No projects in this category.</p>}
        </div>
      </div>
    </section>
  );
};

export default Projects;