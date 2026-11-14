import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["verifier"],
  serverExternalPackages: ["sharp"],
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "https://github.com/me-ndaeyo/monomi#readme",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
