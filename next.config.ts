import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        // Direct S3 origin — kept as a fallback for dev / pre-CDN setups.
        // Production traffic should hit the CloudFront distribution below.
        protocol: "https",
        hostname: "boost-v2-images.s3.ap-south-1.amazonaws.com",
      },
      {
        // CloudFront distribution(s). Wildcard covers any *.cloudfront.net
        // host so a new distribution can be wired without a config change.
        // If a custom CNAME is used (e.g. images.driffle.com), add it as
        // its own remotePatterns entry.
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
