import type { NextConfig } from "next";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { InjectManifest } from "workbox-webpack-plugin";

const publicPrecachePaths = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable.png",
];

const additionalManifestEntries = publicPrecachePaths.map((url) => ({
  url,
  revision: createHash("sha256")
    .update(readFileSync(resolve(process.cwd(), "public", url.slice(1))))
    .digest("hex"),
}));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      config.plugins.push(
        new InjectManifest({
          swSrc: "./src/service-worker.js",
          swDest: "static/raphael-workbox.js",
          additionalManifestEntries,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          exclude: [/\.map$/, /^manifest.*\.js$/, /\.hot-update\./],
          mode: "production",
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
