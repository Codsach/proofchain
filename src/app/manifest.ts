import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ProofChain',
    short_name: 'ProofChain',
    description: 'Digital Forensic Evidence Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#07A572',
    icons: [
      {
        src: '/icon-v2.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/icon-v2.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-v2.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
