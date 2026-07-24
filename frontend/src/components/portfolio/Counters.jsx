import React, { useEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';

const useInView = (ref, threshold = 0.2) => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
};

const AnimatedNumber = ({ target, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return <span ref={ref}>{n}{suffix}</span>;
};

const iconOf = (name) => {
  const map = {
    briefcase: Icons.Briefcase, award: Icons.Award, github: Icons.Github,
    code: Icons.Code, layers: Icons.Layers, clock: Icons.Clock,
    star: Icons.Star, users: Icons.Users, eye: Icons.Eye, download: Icons.Download,
    heart: Icons.Heart, rocket: Icons.Rocket, trophy: Icons.Trophy,
  };
  return map[name] || Icons.Star;
};

const Counters = ({ counters }) => {
  if (!counters?.length) return null;
  return (
    <section className="section-y" style={{ backgroundColor: 'var(--bg)' }} data-testid="counters-section">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>By the numbers</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">Achievements at a <span style={{ color: 'var(--accent)' }}>glance.</span></h2>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {counters.map((c) => {
            const Ico = iconOf(c.icon);
            return (
              <div key={c.id} className="card-soft p-5 text-center" data-testid={`counter-${c.id}`}>
                <div className="inline-flex w-11 h-11 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                  <Ico size={20} />
                </div>
                <div className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
                  <AnimatedNumber target={Number(c.value) || 0} suffix={c.suffix || ''} />
                </div>
                <div className="text-xs mt-1 uppercase tracking-widest font-semibold" style={{ color: 'var(--text-secondary)' }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Counters;
