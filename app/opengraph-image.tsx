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
          background: 'linear-gradient(to bottom right, #080D11, #0B1A24)',
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
          <svg width="220" height="220" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="edumethod-book" x1="4" y1="8" x2="28" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0F8B8D" />
                <stop offset="0.55" stopColor="#2BA84A" />
                <stop offset="1" stopColor="#D9952F" />
              </linearGradient>
            </defs>
            <path
              d="M5.2 8.8C8.5 8.2 11.7 8.8 16 11.1v14.2C12 23 8.5 22.4 5.2 23.1V8.8Z"
              fill="url(#edumethod-book)"
              fillOpacity={0.2}
              stroke="url(#edumethod-book)"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M26.8 8.8C23.5 8.2 20.3 8.8 16 11.1v14.2C20 23 23.5 22.4 26.8 23.1V8.8Z"
              fill="url(#edumethod-book)"
              fillOpacity={0.28}
              stroke="url(#edumethod-book)"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M16 11.1V25.3"
              stroke="url(#edumethod-book)"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M10.2 18.2L13.1 15.2L16.2 17.6L22 11.4"
              stroke="url(#edumethod-book)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 11.4V15.4H18"
              stroke="url(#edumethod-book)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10.2" cy="18.2" r="1.15" fill="#0F8B8D" />
            <circle cx="16.2" cy="17.6" r="1.15" fill="#2BA84A" />
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
              color: '#A7B2BA',
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
        <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, background: 'radial-gradient(circle, rgba(15, 139, 141, 0.25) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -200, right: -200, width: 600, height: 600, background: 'radial-gradient(circle, rgba(217, 149, 47, 0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />
      </div>
    ),
    {
      ...size,
    }
  )
}
