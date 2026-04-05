import * as Sentry from "@sentry/nextjs";

const isProd =
  process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") === false;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: isProd ? "production" : "development",

  // Performance Monitoring
  tracesSampleRate: isProd ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],
});
