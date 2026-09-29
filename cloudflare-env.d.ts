declare namespace Cloudflare {
 interface Env {
  DB: D1Database;
  APP_ORIGIN: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_GITHUB_IDS?: string;
 }
}
