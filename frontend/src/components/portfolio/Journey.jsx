import React from 'react';
import { GraduationCap, Briefcase } from 'lucide-react';

const Journey = ({ experience = [], education = [] }) => {
  const expList = Array.isArray(experience) ? experience : [];
  const eduList = Array.isArray(education) ? education : [];

  const events = [];

  expList.forEach((e) => {
    events.push({
      id: `exp-${e.id || Math.random()}`,
      title: e.role || '',
      subtitle: e.company || '',
      note: e.description || '',
      year: e.currently_working
        ? e.start_date
        : (e.end_date || e.start_date || ''),
      sortKey: e.currently_working
        ? '9999'
        : (e.end_date || e.start_date || ''),
      kind: 'work',
      icon: Briefcase,
    });
  });

  eduList.forEach((e) => {
    events.push({
      id: `edu-${e.id || Math.random()}`,
      title: e.degree || '',
      subtitle: `${e.college || ''}${e.university ? ` · ${e.university}` : ''}`,
      note: e.cgpa ? `CGPA: ${e.cgpa}` : '',
      year: e.passing_year || '',
      sortKey: e.passing_year === 'Present'
        ? '9999'
        : (e.passing_year || ''),
      kind: 'edu',
      icon: GraduationCap,
    });
  });

  events.sort((a, b) => {
    const aPresent = a.sortKey === '9999';
    const bPresent = b.sortKey === '9999';

    if (aPresent && !bPresent) return -1;
    if (!aPresent && bPresent) return 1;

    const getDateValue = (value) => {
      if (!value) return 0;

      const parsed = Date.parse(String(value));

      if (!Number.isNaN(parsed)) {
        return parsed;
      }

      const match = String(value).match(/\d{4}/);

      return match
        ? new Date(Number(match[0]), 0, 1).getTime()
        : 0;
    };

    return getDateValue(b.sortKey) - getDateValue(a.sortKey);
  });

  if (events.length === 0) return null;
  

  return (
    <section className="section-y" style={{ backgroundColor: 'var(--bg-alt)' }} data-testid="journey-section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">My Journey</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            The road <span style={{ color: 'var(--accent)' }}>so far.</span>
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
            Milestones from school to career — everything that shaped what I build today.
          </p>
        </div>

        <div className="mt-12 relative" data-testid="journey-timeline">
          {/* Vertical spine */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px -translate-x-0 sm:-translate-x-1/2" style={{ backgroundColor: 'var(--border)' }}></div>

          <div className="space-y-8">
            {events.map((ev, i) => {
              const Ico = ev.icon;
              const left = i % 2 === 0;
              return (
                <div key={ev.id} className={`relative flex items-center sm:justify-normal ${left ? 'sm:justify-start' : 'sm:justify-end'}`} data-testid={`journey-event-${ev.id}`}>
                  <div className={`w-full sm:w-1/2 pl-12 sm:pl-0 ${left ? 'sm:pr-10' : 'sm:pl-10'}`}>
                    <div className="card-soft p-5">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold mono" style={{ color: 'var(--accent)' }}>
                        <span>{ev.kind === 'work' ? 'Experience' : 'Education'}</span>
                        <span>·</span>
                        <span>{ev.year}</span>
                      </div>
                      <h3 className="mt-1 font-bold text-lg leading-tight">{ev.title}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ev.subtitle}</p>
                      {ev.note && <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{ev.note}</p>}
                    </div>
                  </div>
                  {/* Dot */}
                  <span
                    className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg ring-4 ring-[var(--bg-alt)]"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Ico size={14} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Journey;
