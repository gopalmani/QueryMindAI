/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      { source: '/', destination: '/connections', permanent: false },
      { source: '/dashboard-and-connection', destination: '/connections', permanent: true },
      { source: '/database-browser', destination: '/connections', permanent: true },
      { source: '/sql-editor-and-ai-assistant', destination: '/query', permanent: true },
      { source: '/query-history', destination: '/history', permanent: true },
      { source: '/homepage-login', destination: '/connections', permanent: true },
    ];
  },
};

export default nextConfig;
