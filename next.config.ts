import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    // .md ファイルを無視する設定を追加
    config.module.rules.push({
      test: /\.md$/,
      use: "ignore-loader",
    });
    config.module.rules.push({
      test: /\.node$/,
      use: "null-loader",
    });
    config.module.rules.push({
      test: /(LICENSE|\.txt)$/,
      use: "ignore-loader",
    });
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: "ignore-loader",
    });

    return config;
  },
};

export default nextConfig;
