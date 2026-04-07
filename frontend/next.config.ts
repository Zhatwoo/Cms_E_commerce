import type { NextConfig } from "next";
import os from "os";
import path from "path";

const allowedDevOrigins = Array.from(new Set([
  "localhost",
  "127.0.0.1",
  ...Object.values(os.networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter((info) => info.family === "IPv4" && !info.internal)
    .map((info) => info.address),
]));

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  // Silence "inferred workspace root" warning in monorepo-style setups with multiple lockfiles.
  outputFileTracingRoot: __dirname,
  // Allow accessing the dev server from your phone / LAN IP without cross-origin warnings.
  allowedDevOrigins,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
    ],
  },
  transpilePackages: ['date-fns', 'firebase', '@firebase/app', '@firebase/auth', '@firebase/database', '@firebase/storage'],
  turbopack: {
    resolveAlias: {
      "@firebase/app": "./node_modules/@firebase/app/dist/esm/index.esm2017.js",
      "firebase/app": "./node_modules/firebase/app/dist/esm/index.esm.js",
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@firebase/app": path.resolve(__dirname, "node_modules/@firebase/app/dist/esm/index.esm2017.js"),
      "firebase/app": path.resolve(__dirname, "node_modules/firebase/app/dist/esm/index.esm.js"),
    };

    return config;
  },
};

export default nextConfig;
