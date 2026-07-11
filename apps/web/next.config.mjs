import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { remotePatterns: imageHosts },
  async redirects() {
    return [{ source: '/', destination: '/sql-editor-and-ai-assistant', permanent: false }];
  },
};

export default nextConfig;
