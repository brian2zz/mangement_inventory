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

}

export default nextConfig