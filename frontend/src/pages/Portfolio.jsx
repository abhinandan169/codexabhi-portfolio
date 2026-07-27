import React, { Suspense, lazy, useEffect, useState } from 'react';
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
import SectionSkeleton from '@/components/portfolio/SectionSkeleton';
import { api, mediaUrl } from '@/lib/api';
import { trackView } from '@/lib/analytics';
import { useTheme } from '@/lib/theme';

// Lazy-load heavy / below-the-fold components so they don't block the
// initial JS bundle. Each is code-split and fetched only after the main
// UI has painted.
const CodingProfiles = lazy(() => import('@/components/portfolio/CodingProfiles'));
const GitHubActivity = lazy(() => import('@/components/portfolio/GitHubActivity'));
const TechStack = lazy(() => import('@/components/portfolio/TechStack'));
const Journey = lazy(() => import('@/components/portfolio/Journey'));
const FloatingButtons = lazy(() => import('@/components/portfolio/FloatingButtons'));
const CustomCursor = lazy(() => import('@/components/portfolio/CustomCursor'));
const LiveInfo = lazy(() => import('@/components/portfolio/LiveInfo'));

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
  useTheme();
  // Use `null` for lists that are still fetching, so sections can render
  // a skeleton until real data lands (which may be an empty array).
  const [data, setData] = useState({
    profile: null, seo: null, sections: null,
    skills: null, projects: null, certificates: null, education: null,
    social: null, resume: null, testimonials: null, experience: null, counters: null,
  });

  useEffect(() => {
    let alive = true;
    const set = (patch) => alive && setData((d) => ({ ...d, ...patch }));

    // Stage 1 — critical for layout & first paint: profile + sections + seo.
    // Fire and forget in parallel so anything that needs profile shows fast.
    Promise.all([api.get('/profile'), api.get('/sections'), api.get('/seo')])
      .then(([p, sec, s]) => {
        set({ profile: p.data, sections: sec.data || {}, seo: s.data || {} });
        applySeo(s.data);
      })
      .catch((e) => console.error('critical load failed', e));

    // Stage 2 — non-blocking parallel fetches. Each writes its own slice as
    // soon as it resolves, so sections progressively hydrate.
    const fetchOne = (path, key, mapper = (r) => r.data) =>
      api.get(path).then((r) => set({ [key]: mapper(r) })).catch(() => set({ [key]: [] }));

    fetchOne('/skills', 'skills');
    fetchOne('/projects', 'projects');
    fetchOne('/certificates', 'certificates');
    fetchOne('/education', 'education');
    fetchOne('/social-links', 'social');
    fetchOne('/testimonials', 'testimonials');
    fetchOne('/experience', 'experience');
    fetchOne('/counters', 'counters');
    api.get('/resume').then((r) => set({ resume: r.data })).catch(() => set({ resume: null }));

    trackView('/');
    return () => { alive = false; };
  }, []);

  const S = data.sections || {};
  const on = (key, def = true) => S[key] === undefined ? def : !!S[key];

  // Helpers for progressive rendering: while a list is `null`, show skeleton.
  const withSkeleton = (list, kind, node) => (list === null ? <SectionSkeleton kind={kind} /> : node);

  return (
    <div data-testid="portfolio-root">
      <Navbar profile={data.profile} />
      <main>
        {on('hero') && withSkeleton(
          data.profile ? [] : null,
          'hero',
          <Hero profile={data.profile} resume={data.resume} social={data.social} />
        )}
        {on('about') && (data.profile ? <About profile={data.profile} /> : <SectionSkeleton kind="stack" />)}
        {on('counters') && withSkeleton(data.counters, 'grid-4', <Counters counters={data.counters} />)}
        {on('skills') && withSkeleton(data.skills, 'grid-4', <Skills skills={data.skills} />)}
        {on('projects') && withSkeleton(data.projects, 'grid-3', <Projects projects={data.projects} />)}

        <Suspense fallback={<SectionSkeleton kind="grid-4" />}>
          {data.skills === null ? <SectionSkeleton kind="grid-4" /> : <TechStack skills={data.skills} />}
        </Suspense>
        <Suspense fallback={<SectionSkeleton kind="grid-3" />}>
          {data.social === null ? <SectionSkeleton kind="grid-3" /> : <CodingProfiles social={data.social} />}
        </Suspense>
        <Suspense fallback={<SectionSkeleton kind="grid-3" />}>
          {(!data.profile || data.social === null) ? <SectionSkeleton kind="grid-3" /> : <GitHubActivity profile={{ ...data.profile, social: data.social }} />}
        </Suspense>

        {on('experience') && withSkeleton(data.experience, 'timeline', <Experience experience={data.experience} />)}

        <Suspense fallback={<SectionSkeleton kind="timeline" />}>
          {(data.experience === null || data.education === null) ? <SectionSkeleton kind="timeline" /> : <Journey experience={data.experience} education={data.education} />}
        </Suspense>

        {on('certificates') && withSkeleton(data.certificates, 'grid-3', <Certificates certificates={data.certificates} />)}
        {on('education') && withSkeleton(data.education, 'timeline', <Education education={data.education} />)}
        {on('testimonials') && withSkeleton(data.testimonials, 'grid-3', <Testimonials testimonials={data.testimonials} />)}
        {on('resume') && <Resume resume={data.resume} />}
        {on('hire_me') && (data.profile ? <HireMe profile={data.profile} /> : <SectionSkeleton kind="hero" />)}
        {on('contact') && (data.profile ? <Contact profile={data.profile} /> : <SectionSkeleton kind="stack" />)}
      </main>
      {on('footer') && data.profile && <Footer profile={data.profile} social={data.social || []} />}

      {/* Non-critical UI mounted after first paint via Suspense. */}
      <Suspense fallback={null}>{data.social !== null && <FloatingButtons social={data.social} />}</Suspense>
      <Suspense fallback={null}><CustomCursor /></Suspense>
      <Suspense fallback={null}><LiveInfo /></Suspense>
    </div>
  );
};

export default Portfolio;
