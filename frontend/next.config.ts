import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
    ],
  },
  transpilePackages: ['firebase', '@firebase/app', '@firebase/auth', '@firebase/database', '@firebase/storage'],
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
