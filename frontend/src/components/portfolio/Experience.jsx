import React from 'react';
import { Briefcase, MapPin } from 'lucide-react';
import { mediaUrl } from '@/lib/api';

const Experience = ({ experience }) => {
  if (!experience?.length) return null;
  return (
    <section id="experience" className="section-y" data-testid="experience-section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Experience</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            Where I've <span style={{ color: 'var(--accent)' }}>worked.</span>
          </h2>
        </div>
        <div className="mt-12 relative" data-testid="experience-timeline">
          <div className="absolute left-6 top-0 bottom-0 w-px hidden sm:block" style={{ backgroundColor: 'var(--border)' }}></div>
          <div className="space-y-6">
            {experience.map((e) => (
              <div key={e.id} className="relative sm:pl-16" data-testid={`experience-${e.id}`}>
                <div className="hidden sm:flex absolute left-0 top-4 w-12 h-12 rounded-2xl text-white items-center justify-center shadow-md overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
                  {e.company_logo ? <img src={mediaUrl(e.company_logo)} alt="" className="w-full h-full object-cover" /> : <Briefcase size={20} />}
                </div>
                <div className="card-soft p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">{e.role}</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-semibold">{e.company}</span> · {e.employment_type}
                        {e.location && <> · <span className="inline-flex items-center gap-1"><MapPin size={12} /> {e.location}</span></>}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="badge-red">{e.start_date} — {e.currently_working ? 'Present' : (e.end_date || '')}</span>
                    </div>
                  </div>
                  {e.description && <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{e.description}</p>}
                  {e.technologies?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.technologies.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full border mono" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
