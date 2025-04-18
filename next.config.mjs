/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle bcrypt and other native modules
    if (!isServer) {
      // Don't resolve 'fs', 'bcrypt' or other node modules on the client
      config.resolve.fallback = {
        bcrypt: false,
        fs: false,
        path: false,
        os: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
      }
    }
    return config
  }
};

export default nextConfig;
