import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext config for the Cloudflare Workers adapter. Defaults are enough for
 * Phase 1 (no incremental cache / KV needed yet — the app has no ISR pages).
 * See docs/SETUP.md for the Cloudflare dashboard build/deploy commands.
 */
export default defineCloudflareConfig();
