import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      "@firebase/app": "./node_modules/@firebase/app/dist/esm/index.esm2017.js",
      "firebase/node_modules/@firebase/app/dist/esm/index.esm2017.js": "./node_modules/@firebase/app/dist/esm/index.esm2017.js",
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@firebase/app": path.resolve(__dirname, "node_modules/@firebase/app/dist/esm/index.esm2017.js"),
      "firebase/node_modules/@firebase/app/dist/esm/index.esm2017.js": path.resolve(
        __dirname,
        "node_modules/@firebase/app/dist/esm/index.esm2017.js"
      ),
    };

    return config;
  },
};

export default nextConfig;
