// Shared social/coding-platform icon map used by Footer, CodingProfiles,
// FloatingButtons and any admin previews. Keeps a single source of truth so
// every place that renders a social link shows the correct brand icon.

import { Github, Linkedin, Twitter, Mail, Instagram, MessageCircle, Youtube, Facebook, Globe } from 'lucide-react';
import {
  SiLeetcode, SiHackerrank, SiCodeforces, SiCodechef, SiGeeksforgeeks,
  SiHackerearth, SiKaggle, SiStackoverflow, SiX, SiWhatsapp, SiTelegram,
  SiDiscord, SiMedium, SiDevdotto, SiDribbble, SiBehance, SiReddit,
  SiGitlab, SiBitbucket, SiTwitch, SiPinterest, SiSnapchat, SiTiktok,
  SiThreads, SiMastodon, SiSpotify, SiSubstack, SiProducthunt, SiFigma,
  SiNotion, SiGoogleplay, SiGooglescholar,
} from 'react-icons/si';

// Every entry: matcher token(s) → { icon, label, color }
// The matcher is checked as substring (case-insensitive) against platform key.
// The FIRST match wins, so more specific tokens must come before generic ones.
const ENTRIES = [
  // --- Coding platforms (specific before generic) ---
  { tokens: ['leetcode'], icon: SiLeetcode, label: 'LeetCode', color: '#F89F1B' },
  { tokens: ['hackerrank'], icon: SiHackerrank, label: 'HackerRank', color: '#00EA64' },
  { tokens: ['hackerearth'], icon: SiHackerearth, label: 'HackerEarth', color: '#2C3454' },
  { tokens: ['codeforces'], icon: SiCodeforces, label: 'Codeforces', color: '#1F8ACB' },
  { tokens: ['codechef'], icon: SiCodechef, label: 'CodeChef', color: '#5B4638' },
  { tokens: ['geeksforgeeks', 'gfg'], icon: SiGeeksforgeeks, label: 'GeeksforGeeks', color: '#2F8D46' },
  { tokens: ['kaggle'], icon: SiKaggle, label: 'Kaggle', color: '#20BEFF' },
  { tokens: ['stackoverflow', 'stack overflow', 'stack-overflow'], icon: SiStackoverflow, label: 'Stack Overflow', color: '#F48024' },
  { tokens: ['gitlab'], icon: SiGitlab, label: 'GitLab', color: '#FC6D26' },
  { tokens: ['bitbucket'], icon: SiBitbucket, label: 'Bitbucket', color: '#0052CC' },
  { tokens: ['github'], icon: Github, label: 'GitHub', color: '#181717' },
  // --- Social & messaging ---
  { tokens: ['linkedin'], icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
  { tokens: ['whatsapp', 'whats'], icon: SiWhatsapp, label: 'WhatsApp', color: '#25D366' },
  { tokens: ['telegram'], icon: SiTelegram, label: 'Telegram', color: '#26A5E4' },
  { tokens: ['discord'], icon: SiDiscord, label: 'Discord', color: '#5865F2' },
  { tokens: ['instagram', 'insta'], icon: Instagram, label: 'Instagram', color: '#E4405F' },
  { tokens: ['facebook'], icon: Facebook, label: 'Facebook', color: '#1877F2' },
  { tokens: ['youtube'], icon: Youtube, label: 'YouTube', color: '#FF0000' },
  { tokens: ['twitch'], icon: SiTwitch, label: 'Twitch', color: '#9146FF' },
  { tokens: ['pinterest'], icon: SiPinterest, label: 'Pinterest', color: '#BD081C' },
  { tokens: ['snapchat'], icon: SiSnapchat, label: 'Snapchat', color: '#FFFC00' },
  { tokens: ['tiktok'], icon: SiTiktok, label: 'TikTok', color: '#010101' },
  { tokens: ['threads'], icon: SiThreads, label: 'Threads', color: '#000000' },
  { tokens: ['mastodon'], icon: SiMastodon, label: 'Mastodon', color: '#6364FF' },
  { tokens: ['reddit'], icon: SiReddit, label: 'Reddit', color: '#FF4500' },
  // X / Twitter — 'twitter' or a standalone 'x'
  { tokens: ['x/twitter', 'x-twitter', 'twitter'], icon: SiX, label: 'X', color: '#000000' },
  { tokens: ['x'], icon: SiX, label: 'X', color: '#000000', exact: true },
  // --- Publishing / content ---
  { tokens: ['medium'], icon: SiMedium, label: 'Medium', color: '#000000' },
  { tokens: ['dev.to', 'devto', 'dev to'], icon: SiDevdotto, label: 'Dev.to', color: '#0A0A0A' },
  { tokens: ['substack'], icon: SiSubstack, label: 'Substack', color: '#FF6719' },
  { tokens: ['dribbble'], icon: SiDribbble, label: 'Dribbble', color: '#EA4C89' },
  { tokens: ['behance'], icon: SiBehance, label: 'Behance', color: '#1769FF' },
  { tokens: ['producthunt', 'product hunt'], icon: SiProducthunt, label: 'Product Hunt', color: '#DA552F' },
  { tokens: ['figma'], icon: SiFigma, label: 'Figma', color: '#F24E1E' },
  { tokens: ['notion'], icon: SiNotion, label: 'Notion', color: '#000000' },
  { tokens: ['google scholar', 'scholar'], icon: SiGooglescholar, label: 'Google Scholar', color: '#4285F4' },
  { tokens: ['play store', 'google play'], icon: SiGoogleplay, label: 'Google Play', color: '#414141' },
  { tokens: ['spotify'], icon: SiSpotify, label: 'Spotify', color: '#1DB954' },
  // --- Direct contact ---
  { tokens: ['email', 'mail', 'gmail'], icon: Mail, label: 'Email', color: '#EA4335' },
  { tokens: ['website', 'portfolio', 'blog'], icon: Globe, label: 'Website', color: '#4B5563' },
];

const FALLBACK = { icon: MessageCircle, label: 'Link', color: '#6B7280' };

/**
 * Given a platform label (case-insensitive), return { icon, label, color }.
 * Falls back to a generic icon for unknown platforms.
 */
export const getSocialMeta = (platform) => {
  if (!platform || typeof platform !== 'string') return FALLBACK;
  const k = platform.toLowerCase().trim();
  for (const e of ENTRIES) {
    for (const t of e.tokens) {
      if (e.exact ? k === t : k.includes(t)) return { icon: e.icon, label: e.label, color: e.color };
    }
  }
  return FALLBACK;
};

/** Convenience helper: just the icon component. */
export const getSocialIcon = (platform) => getSocialMeta(platform).icon;

/** True if this platform maps to a known brand (used by CodingProfiles filter). */
export const isKnownPlatform = (platform) => getSocialMeta(platform).icon !== FALLBACK.icon;
