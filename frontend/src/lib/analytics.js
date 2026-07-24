import { api } from '@/lib/api';

const SESSION_KEY = 'ak_session_id';

const getSessionId = () => {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
};

export const trackView = (path = window.location.pathname) => {
  try {
    api.post('/analytics/track', {
      path,
      session_id: getSessionId(),
      referrer: document.referrer || '',
      event: 'view',
    });
  } catch {}
};

export const trackProject = (projectId) => {
  try {
    api.post('/analytics/track', {
      path: window.location.pathname,
      session_id: getSessionId(),
      referrer: document.referrer || '',
      event: 'project_view',
      project_id: projectId,
    });
  } catch {}
};

export const trackResumeDownload = () => {
  try {
    api.post('/resume/track-download');
  } catch {}
};

export const trackContactSubmit = () => {
  try {
    api.post('/analytics/track', {
      path: window.location.pathname,
      session_id: getSessionId(),
      referrer: document.referrer || '',
      event: 'contact_submit',
    });
  } catch {}
};
