import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  env: {
    // Google Apps Script
    GAS_URL: process.env.GAS_URL,
    GAS_SECRET_KEY: process.env.GAS_SECRET_KEY,

    // 클라이언트에서 사용하는 공개 환경변수
    NEXT_PUBLIC_GAS_URL: process.env.GAS_URL,
    NEXT_PUBLIC_GAS_SECRET_KEY: process.env.GAS_SECRET_KEY,
  },
};

export default nextConfig;
