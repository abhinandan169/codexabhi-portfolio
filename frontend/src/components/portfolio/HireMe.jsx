import React from 'react';
import { Briefcase, ArrowRight } from 'lucide-react';

const HireMe = ({ profile }) => (
  <section id="hire-me" className="section-y" data-testid="hireme-section">
    <div className="container-x">
      <div className="rounded-3xl bg-[#111111] text-white p-10 sm:p-16 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E53935] rounded-full blur-3xl opacity-40"></div>
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 text-[#E53935] text-xs font-semibold tracking-widest uppercase mono" data-testid="hireme-eyebrow">
            <span className="w-5 h-px bg-[#E53935]"></span> Hire Me
          </span>
          <h2
            className="text-3xl sm:text-5xl font-bold mt-3 leading-tight break-words"
            style={{ textWrap: 'balance' }}
          >
            Looking for a Software Engineer who ships{' '}
            <span className="text-[#E53935] whitespace-nowrap">quality code?</span>
          </h2>
          <p className="mt-5 text-gray-300 text-lg max-w-2xl">
            I'm currently open to Software Engineering opportunities — full-time, contract, or freelance. Let's chat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact" className="btn-primary" data-testid="hireme-cta-btn">
              <Briefcase size={16} /> Get in touch <ArrowRight size={16} />
            </a>
            {profile?.email && (
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(profile.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ backgroundColor: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.25)' }}
                data-testid="hireme-email-btn"
              >
                Email Me
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HireMe;
