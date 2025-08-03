import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  basePath: '/S-P_500_Data_Visualization',
  assetPrefix: '/S-P_500_Data_Visualization/',
  env: {
    NEXT_PUBLIC_BASE_PATH: `/S-P_500_Data_Visualization`,
  },
};

export default nextConfig;

export const getBasePath = () => process.env.NEXT_PUBLIC_BASE_PATH ?? "";

