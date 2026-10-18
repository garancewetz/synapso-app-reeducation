import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    // 🔒 SÉCURITÉ: Autoriser le microphone pour la dictée vocale
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=()'
  },
  {
    // 🔒 SÉCURITÉ: Content Security Policy pour prévenir les attaques XSS
    // Note: 'unsafe-inline' reste nécessaire pour les scripts inline injectés par Next.js
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // unsafe-eval uniquement en dev (React Refresh / HMR) : le build de prod n'en a pas besoin
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'", // Tailwind CSS et Next.js nécessitent unsafe-inline pour les styles
      "img-src 'self' data: blob: https://res.cloudinary.com", // data: pour les images inline, blob: pour les images générées, Cloudinary pour les médias
      "font-src 'self'", // Fonts locales uniquement (next/font)
      "connect-src 'self' https://res.cloudinary.com", // API calls vers même origine + Cloudinary pour les médias
      "worker-src 'self' blob:", // Service Worker (blob: nécessaire pour certains navigateurs)
      "frame-ancestors 'none'", // Empêcher l'inclusion dans des iframes
      "base-uri 'self'", // Base URI uniquement depuis la même origine
      "form-action 'self'", // Les formulaires ne peuvent envoyer qu'à la même origine
      "manifest-src 'self'", // Manifest PWA uniquement depuis la même origine
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  // ⚡ PERFORMANCE: tree-shaking plus agressif sur les librairies partiellement utilisées
  experimental: {
    optimizePackageImports: ['date-fns', 'clsx', 'zod', 'framer-motion'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
