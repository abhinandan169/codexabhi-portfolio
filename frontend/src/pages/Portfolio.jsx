import React, { useEffect, useState } from 'react';
import Navbar from '@/components/portfolio/Navbar';
import Hero from '@/components/portfolio/Hero';
import About from '@/components/portfolio/About';
import Counters from '@/components/portfolio/Counters';
import Skills from '@/components/portfolio/Skills';
import Projects from '@/components/portfolio/Projects';
import Certificates from '@/components/portfolio/Certificates';
import Experience from '@/components/portfolio/Experience';
import Education from '@/components/portfolio/Education';
import Testimonials from '@/components/portfolio/Testimonials';
import Resume from '@/components/portfolio/Resume';
import HireMe from '@/components/portfolio/HireMe';
import Contact from '@/components/portfolio/Contact';
import Footer from '@/components/portfolio/Footer';
import FloatingButtons from '@/components/portfolio/FloatingButtons';
import CustomCursor from '@/components/portfolio/CustomCursor';
import CodingProfiles from '@/components/portfolio/CodingProfiles';
import GitHubActivity from '@/components/portfolio/GitHubActivity';
import TechStack from '@/components/portfolio/TechStack';
import Journey from '@/components/portfolio/Journey';
import LiveInfo from '@/components/portfolio/LiveInfo';
import { api, mediaUrl } from '@/lib/api';
import { trackView } from '@/lib/analytics';
import { useTheme } from '@/lib/theme';

const setMeta = (name, content, isProperty = false) => {
  if (!content) return;
  const key = isProperty ? 'property' : 'name';
  let el = document.head.querySelector(`meta[${key}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setLink = (rel, href) => {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const applySeo = (seo) => {
  if (!seo) return;
  if (seo.meta_title || seo.site_title) document.title = seo.meta_title || seo.site_title;
  setMeta('description', seo.meta_description);
  setMeta('keywords', seo.keywords);
  setMeta('robots', seo.robots || 'index, follow');
  setMeta('og:title', seo.og_title || seo.meta_title, true);
  setMeta('og:description', seo.og_description || seo.meta_description, true);
  if (seo.og_image) setMeta('og:image', mediaUrl(seo.og_image), true);
  setMeta('twitter:card', seo.twitter_card || 'summary_large_image');
  if (seo.canonical_url) setLink('canonical', seo.canonical_url);
  if (seo.favicon) setLink('icon', mediaUrl(seo.favicon));
  if (seo.google_verification) setMeta('google-site-verification', seo.google_verification);
  if (seo.bing_verification) setMeta('msvalidate.01', seo.bing_verification);
};

const Portfolio = () => {
  const { theme } = useTheme();
  const [data, setData] = useState({
    profile: null, skills: [], projects: [], certificates: [], education: [],
    social: [], resume: null, testimonials: [], experience: [], counters: [],
    sections: {}, seo: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profile, skills, projects, certificates, education, social, resume, testimonials, experience, counters, sections, seo] = await Promise.all([
          api.get('/profile'),
          api.get('/skills'),
          api.get('/projects'),
          api.get('/certificates'),
          api.get('/education'),
          api.get('/social-links'),
          api.get('/resume'),
          api.get('/testimonials'),
          api.get('/experience'),
          api.get('/counters'),
          api.get('/sections'),
          api.get('/seo'),
        ]);
        setData({
          profile: profile.data,
          skills: skills.data,
          projects: projects.data,
          certificates: certificates.data,
          education: education.data,
          social: social.data,
          resume: resume.data,
          testimonials: testimonials.data,
          experience: experience.data,
          counters: counters.data,
          sections: sections.data || {},
          seo: seo.data || {},
        });
        applySeo(seo.data);
      } catch (e) {
        console.error('load failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    trackView('/');
  }, []);

  if (loading && theme?.loader_enabled !== false) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }} data-testid="portfolio-loading">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }
  if (loading) return null;

  const S = data.sections || {};
  const on = (key, def = true) => S[key] === undefined ? def : !!S[key];

  return (
    <div data-testid="portfolio-root">
      <Navbar profile={data.profile} />
      <main>
        {on('hero') && <Hero profile={data.profile} resume={data.resume} social={data.social} />}
        {on('about') && <About profile={data.profile} />}
        {on('counters') && <Counters counters={data.counters} />}
        {on('skills') && <Skills skills={data.skills} />}
        {on('projects') && <Projects projects={data.projects} />}
        <TechStack skills={data.skills} />
        <CodingProfiles social={data.social} />
        <GitHubActivity profile={{ ...data.profile, social: data.social }} />
        {on('experience') && <Experience experience={data.experience} />}
        <Journey experience={data.experience} education={data.education} />
        {on('certificates') && <Certificates certificates={data.certificates} />}
        {on('education') && <Education education={data.education} />}
        {on('testimonials') && <Testimonials testimonials={data.testimonials} />}
        {on('resume') && <Resume resume={data.resume} />}
        {on('hire_me') && <HireMe profile={data.profile} />}
        {on('contact') && <Contact profile={data.profile} />}
      </main>
      {on('footer') && <Footer profile={data.profile} social={data.social} />}
      <FloatingButtons social={data.social} />
      <CustomCursor />
      <LiveInfo />
    </div>
  );
};

export default Portfolio;
