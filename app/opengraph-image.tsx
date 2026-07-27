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
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
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
            <path d="M4 18L12 20L12 9L4 7Z" fill="url(#prism-cool)" stroke="none" opacity="0.9" />
            <path d="M20 18L12 20L12 9L20 7Z" fill="url(#prism-warm)" stroke="none" opacity="0.9" />
            <path d="M4 18L12 20L12 9L4 7Z" stroke="#F8FAFC" />
            <path d="M20 18L12 20L12 9L20 7Z" stroke="#F8FAFC" />
            <path d="M12 16L12 2" stroke="#F8FAFC" strokeWidth="2" />
            <path d="M8 6L12 2L16 6" stroke="#F8FAFC" strokeWidth="2" />
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
