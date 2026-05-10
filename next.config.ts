import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        // CloudFront distribution(s). Wildcard covers any *.cloudfront.net
        // host so a new distribution can be wired without a config change.
        // If a custom CNAME is used (e.g. images.driffle.com), add it as
        // its own remotePatterns entry. Direct S3 origin is intentionally
        // not allowed — bucket is locked behind CloudFront via OAC.
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
