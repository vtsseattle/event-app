import type { NextConfig } from "next";
import path from "path";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE === "true";

// Relative paths for Turbopack (no Windows absolute path support)
const turbopackAliases: Record<string, string> = {
  "firebase/app": "./src/lib/mock/firebase-app",
  "firebase/firestore": "./src/lib/mock/firebase-firestore",
  "firebase/auth": "./src/lib/mock/firebase-auth",
  "firebase/storage": "./src/lib/mock/firebase-storage",
  "firebase-admin/app": "./src/lib/mock/firebase-admin-app",
  "firebase-admin/firestore": "./src/lib/mock/firebase-admin-firestore",
};

// Absolute paths for Webpack
const mockDir = path.resolve("./src/lib/mock");
const webpackAliases: Record<string, string> = {
  "firebase/app": path.join(mockDir, "firebase-app"),
  "firebase/firestore": path.join(mockDir, "firebase-firestore"),
  "firebase/auth": path.join(mockDir, "firebase-auth"),
  "firebase/storage": path.join(mockDir, "firebase-storage"),
  "firebase-admin/app": path.join(mockDir, "firebase-admin-app"),
  "firebase-admin/firestore": path.join(mockDir, "firebase-admin-firestore"),
};

const nextConfig: NextConfig = {
  images: {
    ...(useMock ? { unoptimized: true } : {}),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

if (useMock) {
  nextConfig.turbopack = { resolveAlias: turbopackAliases };
  nextConfig.webpack = (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = { ...(config.resolve.alias || {}), ...webpackAliases };
    return config;
  };
}

export default nextConfig;
