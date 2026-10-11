const pocketBaseUrl = new URL(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
)
const localPocketBase = ["localhost", "127.0.0.1", "[::1]"].includes(
  pocketBaseUrl.hostname
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Thread workers also support local Windows environments that block forks.
    workerThreads: process.env.NODE_ENV === "development",
  },
  images: {
    // Local development images load directly; the optimizer blocks private IPs.
    unoptimized: process.env.NODE_ENV === "development" && localPocketBase,
    remotePatterns: [
      {
        protocol: pocketBaseUrl.protocol.slice(0, -1),
        hostname: pocketBaseUrl.hostname,
        port: pocketBaseUrl.port,
        pathname: `${pocketBaseUrl.pathname.replace(/\/$/, "")}/api/files/**`,
      },
      {
        protocol: "https",
        hostname: "pocketbase.spcloud.pro",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8090",
      },
    ],
  },
}

export default nextConfig
