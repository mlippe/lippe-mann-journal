import type { NextConfig } from 'next';
import { siteConfig } from './src/site.config';

const s3PublicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';
let s3Hostname = '';
let s3Protocol = 'https';
let s3Port = '';
let s3Pathname = '/**';

if (s3PublicUrl) {
  try {
    const s3Url = new URL(s3PublicUrl);
    s3Hostname = s3Url.hostname;
    s3Protocol = s3Url.protocol.replace(':', '');
    s3Port = s3Url.port;
    if (s3Url.pathname && s3Url.pathname !== '/') {
      s3Pathname = `${s3Url.pathname.replace(/\/+$/, '')}/**`;
    }
  } catch (e) {
    console.error('Invalid NEXT_PUBLIC_S3_PUBLIC_URL:', s3PublicUrl);
  }
}

const useCloudflareLoader = siteConfig.imageLoader === 'cloudflare';

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  reactCompiler: true,
  images: {
    ...(useCloudflareLoader && {
      loader: 'custom',
      loaderFile: './src/lib/cloudflare-image-loader.ts',
    }),
    remotePatterns: s3Hostname
      ? [
          {
            protocol: s3Protocol as 'http' | 'https',
            hostname: s3Hostname,
            port: s3Port,
            pathname: s3Pathname,
          },
        ]
      : [],
  },
};

export default nextConfig;
