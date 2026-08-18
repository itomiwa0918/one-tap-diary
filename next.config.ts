import type { NextConfig } from "next"
import { withSerwist } from "@serwist/turbopack"

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/diagram", destination: "/index.html" }]
  },
}

export default withSerwist(nextConfig)
