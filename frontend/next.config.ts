import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: [
        "localhost:3010",
        "127.0.0.1:3010",
        "0.0.0.0:3010",
        "192.168.0.66:3010"
    ],
};

export default nextConfig;
