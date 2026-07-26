import React from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Download, Eye, Share2, Send, Briefcase, ArrowRight } from 'lucide-react';
import { mediaUrl } from '@/lib/api';
import { trackResumeDownload } from '@/lib/analytics';
import { toast } from 'sonner';

const Hero = ({ profile, resume, social }) => {
  const typingTexts = (profile?.typing_texts && profile.typing_texts.length > 0)
    ? profile.typing_texts
    : ['Software Engineer', 'Python Developer', 'Problem Solver'];

  const seq = typingTexts.flatMap((t) => [t, 2000]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const resumeUrl = resume?.file_url ? mediaUrl(resume.file_url) : '';

  const handleDownload = () => {
    if (!resumeUrl) { toast.info('Resume Coming Soon'); return; }
    trackResumeDownload();
    const a = document.createElement('a');
    a.href = resumeUrl;
    a.download = '';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleView = () => {
    if (!resumeUrl) { toast.info('Resume Coming Soon'); return; }
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (!resumeUrl) { toast.info('Resume Coming Soon'); return; }
    const url = resumeUrl;
    if (navigator.share) {
      try { await navigator.share({ title: `${profile?.name}'s Resume`, url }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Resume link copied to clipboard');
    }
  };

  return (
    <section id="home" className="relative pt-28 pb-20 sm:pt-36 sm:pb-24 overflow-hidden" data-testid="hero-section">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -right-40 w-96 h-96 rounded-full bg-[#FFEBEE] blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 rounded-full bg-[#FFEBEE] blur-3xl opacity-40"></div>
      </div>

      <div className="container-x grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-7 order-2 lg:order-1 fade-in-up">
          <span className="eyebrow" data-testid="hero-eyebrow">Welcome to my portfolio</span>

          <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[0.98] mt-3">
            Hi, I'm{' '}
            <span className="hero-gradient-text inline-block">
              {profile?.name || 'Abhinandan Kumar'}
            </span>
          </h1>

          <div className="hero-title-fixed mt-4 text-xl sm:text-3xl font-semibold text-[#111111]" data-testid="hero-typing">
            I'm a{' '}
            <span className="text-[#E53935]">
              <TypeAnimation
                sequence={seq}
                wrapper="span"
                cursor={true}
                repeat={Infinity}
                speed={50}
              />
            </span>
          </div>

          <p className="mt-7 text-base sm:text-lg text-[#555555] leading-[1.75] max-w-2xl" data-testid="hero-intro">
            {profile?.intro || 'Passionate about building elegant software solutions.'}
          </p>

          <div className="mt-10 flex flex-wrap gap-3" data-testid="hero-actions">
            <button onClick={() => scrollTo('contact')} className="btn-primary" data-testid="hero-hire-btn">
              <Briefcase size={16} /> Hire Me
            </button>
            <button onClick={() => scrollTo('projects')} className="btn-secondary" data-testid="hero-projects-btn">
              View Projects <ArrowRight size={16} />
            </button>
            <button onClick={handleDownload} className="btn-secondary" data-testid="hero-download-resume-btn">
              <Download size={16} /> Download Resume
            </button>
            <button onClick={handleView} className="btn-secondary" data-testid="hero-view-resume-btn">
              <Eye size={16} /> View Resume
            </button>
            <button onClick={handleShare} className="btn-secondary" data-testid="hero-share-resume-btn">
              <Share2 size={16} /> Share Resume
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm text-[#555555]" data-testid="hero-stats">
            <div><span className="text-3xl font-extrabold text-[#111111] tracking-tight">1+</span><div className="text-[11px] uppercase tracking-[0.15em] mt-0.5">Years Coding</div></div>
            <div className="w-px h-10 bg-[#E5E7EB]"></div>
            <div><span className="text-3xl font-extrabold text-[#111111] tracking-tight">5+</span><div className="text-[11px] uppercase tracking-[0.15em] mt-0.5">Projects</div></div>
            <div className="w-px h-10 bg-[#E5E7EB]"></div>
            <div><span className="text-3xl font-extrabold text-[#111111] tracking-tight">500+</span><div className="text-[11px] uppercase tracking-[0.15em] mt-0.5">DSA Problems</div></div>
          </div>
        </div>

        <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center lg:justify-end fade-in-up">
          <div className="relative">
            {/* Outer glow rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E53935] via-[#FF7A70] to-[#FFB8B0] blur-3xl opacity-40 animate-pulse-slow"></div>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#E53935]/30 to-transparent blur-xl"></div>
            {/* Rotating gradient ring */}
            <div className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,#E53935,#FF7A70,#E53935)] opacity-70 animate-spin-slow"></div>
            {/* Image container - perfectly circular */}
            <div
              className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden ring-[6px] ring-white shadow-[0_20px_60px_-15px_rgba(229,57,53,0.5),0_10px_30px_-10px_rgba(0,0,0,0.15)]"
              data-testid="hero-image-container"
            >
              {profile?.profile_image ? (
                <img
                  src={mediaUrl(profile.profile_image)}
                  alt={profile?.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  data-testid="hero-profile-image"
                />
              ) : (
                <div className="w-full h-full bg-[#FAFAFA] flex items-center justify-center text-[#E53935] text-7xl font-bold">
                  {profile?.name?.[0] || 'A'}
                </div>
              )}
            </div>
            {/* Floating "Available" badge */}
            <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 bg-white rounded-full shadow-lg px-4 py-2 border border-[#E5E7EB] flex items-center gap-2" data-testid="hero-badge">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                <span className="relative w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              </span>
              <span className="text-sm font-semibold text-[#111111]">Available for Hire</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
