/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ['@demoeng/utils', '@demoeng/tools-panel'],
  typescript: {
    ignoreBuildErrors: process.env.BUILD_ENVIRONMENT === 'CUSTOM',
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/default',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
