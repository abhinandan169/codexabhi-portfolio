import React from 'react';
import { User, Sparkles, Target, Zap } from 'lucide-react';

const highlights = [
  { icon: Target, title: 'Problem Solver', text: '500+ DSA problems solved.' },
  { icon: Zap, title: 'Fast Shipper', text: 'From idea to production quickly.' },
  { icon: Sparkles, title: 'Clean Code', text: 'Maintainable, tested, elegant.' },
];

const About = ({ profile }) => {
  return (
    <section id="about" className="section-y bg-[#FAFAFA]" data-testid="about-section">
      <div className="container-x grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <span className="eyebrow">About Me</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            A little bit <span className="text-[#E53935]">about me.</span>
          </h2>
          <p className="mt-6 text-lg text-[#555555] leading-7 tracking-normal break-normal" data-testid="about-text">
            {profile?.about || 'I am a Software Engineer passionate about building scalable systems.'}
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {highlights.map((h, idx) => (
            <div key={idx} className="card-soft p-6" data-testid={`about-highlight-${idx}`}>
              <div className="w-11 h-11 rounded-xl bg-[#FFEBEE] flex items-center justify-center text-[#E53935] mb-4">
                <h.icon size={20} />
              </div>
              <h3 className="text-lg font-bold">{h.title}</h3>
              <p className="mt-1.5 text-sm text-[#555555] leading-relaxed">{h.text}</p>
            </div>
          ))}
          <div className="sm:col-span-3 card-soft p-6 flex items-center gap-4" data-testid="about-cta-card">
            <div className="w-11 h-11 rounded-xl bg-[#E53935] text-white flex items-center justify-center flex-shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">Let's build something great together.</h3>
              <p className="text-sm text-[#555555]">Currently available for full-time roles, freelance, and collaborations.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
