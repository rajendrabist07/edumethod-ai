import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'EduMethod AI'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #030409, #1e1b4b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="prism-cool" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="prism-warm" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <g transform="scale(0.96) translate(10, 10)">
              <polygon points="96,96 176,96 176,416 96,416" fill="url(#prism-cool)" />
              <polygon points="176,96 416,96 336,176 176,176" fill="url(#prism-warm)" />
              <polygon points="176,96 336,176 176,176" fill="white" opacity="0.2" />
              <polygon points="176,216 356,216 276,296 176,296" fill="url(#prism-cool)" />
              <polygon points="176,216 276,296 176,296" fill="white" opacity="0.25" />
              <polygon points="176,336 416,336 336,416 176,416" fill="url(#prism-warm)" />
              <polygon points="176,336 336,416 176,416" fill="white" opacity="0.2" />
            </g>
          </svg>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
          <h1
            style={{
              fontSize: 84,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              margin: 0,
              color: '#F8FAFC',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            EduMethod AI
          </h1>
          <p
            style={{
              fontSize: 36,
              color: '#94A3B8',
              marginTop: 16,
              textAlign: 'center',
              fontWeight: 600,
              maxWidth: 900,
            }}
          >
            Hyper-Accurate 7-Day Study Plans & AI Doubt Solver
          </p>
        </div>
        
        {/* Decorative Prism Glows */}
        <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -200, right: -200, width: 600, height: 600, background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />
      </div>
    ),
    {
      ...size,
    }
  )
}
