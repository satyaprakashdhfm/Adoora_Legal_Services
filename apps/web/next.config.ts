import type { NextConfig } from "next";

/**
 * Where this server forwards `/api/*`. On Railway this is the API's private
 * address (`http://adoora-api.railway.internal:<port>`), so the hop never
 * leaves the project network. Read at build time — the rewrite table is
 * compiled into the build — so a change needs a redeploy.
 */
const apiOrigin = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  experimental: {
    /*
     * Document uploads pass through the `/api` rewrite below, and Next
     * buffers a proxied request body — silently cutting it off at 10 MB by
     * default, which reaches the API as a truncated upload. Keep this a
     * little above the API's own MAX_UPLOAD_MB (25) plus multipart overhead,
     * so the API is the one that refuses an oversized file, with a message.
     */
    proxyClientMaxBodySize: "30mb",
    // The default 30s is too short for a 25 MB scan on a slow connection.
    proxyTimeout: 120_000,
  },

  /*
   * The dashboards call the API through this site's own origin. That makes
   * the session cookie first-party — httpOnly, SameSite=Lax, scoped to this
   * host — instead of a third-party cookie on the API's domain, which
   * browsers increasingly refuse. Google's OAuth redirect lands here too.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        // Signed-in areas: never indexed, never cached by a shared cache.
        source: "/:area(admin|dashboard|login)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      /*
       * Technology, Media & Telecommunications was retired as a practice —
       * the firm's own brochure does not carry it. The sector page at
       * /domains/technology-media-telecom is unaffected and still covers the
       * industry; only the practice page is gone, so its URL is sent to the
       * practices index rather than left to 404.
       */
      {
        source: "/services/technology-media-telecom",
        destination: "/services",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
