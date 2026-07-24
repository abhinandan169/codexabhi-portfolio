import React, { useEffect, useRef, useState } from 'react';

const Skills = ({ skills }) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="skills" className="section-y" ref={ref} data-testid="skills-section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">My Skills</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            Technologies I <span className="text-[#E53935]">work with.</span>
          </h2>
          <p className="mt-4 text-lg text-[#555555]">A curated toolkit I use to ship robust, scalable software.</p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8" data-testid="skills-list">
          {skills.map((s, i) => (
            <div key={s.id} data-testid={`skill-${s.name.toLowerCase()}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#111111]">{s.name}</span>
                  <span className="badge-red" style={{ padding: '0.15rem 0.65rem', fontSize: '0.7rem' }}>{s.category}</span>
                </div>
                <span className="text-sm font-semibold text-[#E53935] mono">{s.level}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#E53935] to-[#FF5A50] rounded-full transition-all"
                  style={{
                    width: inView ? `${s.level}%` : '0%',
                    transitionDuration: '1.4s',
                    transitionDelay: `${i * 100}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          ))}
          {skills.length === 0 && (
            <p className="text-[#888888]" data-testid="skills-empty">No skills added yet. Add them from the admin dashboard.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Skills;
