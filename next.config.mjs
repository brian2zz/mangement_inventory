/** @type {import('next').NextConfig} */
const nextConfig = {
  // HAPUS bagian eslint (Next 16 sudah tidak support di config)

  typescript: {
    ignoreBuildErrors: true,
  },

  trailingSlash: true,

  images: {
    unoptimized: true,
  },

  output: 'export',

  experimental: {
    turbo: false, // WAJIB untuk CloudLinux
  },
}

export default nextConfig