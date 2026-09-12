import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
