import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    /** Dev only: forward browser `console.*` to the terminal (shows as `[browser] …`). */
    browserToTerminal: true,
  },
};

export default nextConfig;
