const nextConfig = {
  eslint: {
    // This will still show warnings but won't fail the build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This will still show errors but won't fail the build
    ignoreBuildErrors: true,
  },
  output: 'standalone',
}

module.exports = nextConfig

