import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const nextConfig = (phase) => ({
  // Keep the development cache separate from production builds so `next dev`
  // never reuses stale server chunks emitted by `next build`.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"
});

export default nextConfig;
