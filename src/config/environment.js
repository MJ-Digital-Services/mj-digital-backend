import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME || 'mj-digital-media',
    publicUrl: process.env.R2_PUBLIC_URL,
  },
  cms: {
    // mj-digital-cms (Payload) — pinged every 5 minutes to drive its
    // scheduled-publish job queue, since it runs on Vercel's serverless
    // runtime with no persistent process of its own. See
    // src/jobs/triggerCmsScheduledPublish.job.js and mj-digital-cms's
    // CLAUDE.md "Scheduled Publishing".
    url: process.env.CMS_URL || 'https://cms.mjdigitalservices.com',
    cronSecret: process.env.CMS_CRON_SECRET,
  },
};