import cron from 'node-cron';
import { config } from '../config/environment.js';

// mj-digital-cms (Payload, cms.mjdigitalservices.com) handles its own
// scheduled-publish logic internally, but it's deployed on Vercel's
// serverless runtime, which has no persistent process to tick that on its
// own — Payload's job queue just sits there until something externally
// pings its run endpoint. This backend runs as a persistent process with
// node-cron in use, so it does the pinging instead of standing up a
// separate cron service just for this.
export const triggerCmsScheduledPublish = async () => {
  if (!config.cms.cronSecret) return; // not configured — skip silently

  const url = `${config.cms.url}/api/payload-jobs/run?cronSecret=${config.cms.cronSecret}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`⚠️  CMS scheduled-publish trigger failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('❌ CMS scheduled-publish trigger crashed:', err.message);
  }
};

export const startCmsScheduledPublishCron = () => {
  cron.schedule('*/5 * * * *', () => {
    triggerCmsScheduledPublish();
  });
  console.log('🕐 CMS scheduled-publish trigger cron scheduled (every 5 minutes)');
};
