import ky from "ky";
import { logger } from "@/lib/logger";

// .env.production / .env.development set VITE_API_BASE_URL="" so prod (monolith)
// and dev (Vite proxy) both use same-origin /api. Tests set an absolute URL.
//
// Empty → "/" (root-absolute), NOT "" — with an empty prefix, ky would resolve
// relative request paths like "api/jobs/2" against the current page URL, so on a
// nested route (e.g. /jobs/2/edit) the request would wrongly go to
// /jobs/2/api/jobs/2 and hit the SPA fallback (HTML) instead of the API. "/"
// pins every request to the origin root → "/api/jobs/2".
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/";

export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          try {
            const body = (await response.json()) as {
              message?: string;
              error?: string;
            };
            // Most endpoints use { message }; the jobs API uses { error } (e.g.
            // invalid cron). Fall back to either so the UI can surface the reason.
            const message = body.message || body.error || error.message;
            logger.error(`API ${response.url} failed: ${response.status}`, message);
            error.message = message;
          } catch {
            logger.warn(`Failed to parse error response: ${response.url}`);
          }
        } else {
          logger.error("Network request failed", error.message);
        }
        return error;
      },
    ],
  },
});
