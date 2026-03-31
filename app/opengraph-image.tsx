import { ImageResponse } from 'next/og'
import { getAppUrl } from '@/lib/utils'

export const runtime = 'edge'
export const alt = 'Dat3Night logo and share preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  const logoUrl = `${getAppUrl()}/apple-touch-icon.png`

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #12091b 0%, #2a1241 45%, #140a1f 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: 'radial-gradient(circle at 18% 18%, rgba(236, 72, 153, 0.18) 0%, transparent 48%), radial-gradient(circle at 82% 82%, rgba(251, 191, 36, 0.14) 0%, transparent 44%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '56px 64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              maxWidth: '680px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: 'rgba(255,255,255,0.72)',
                fontSize: '26px',
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  display: 'flex',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.14)',
                  boxShadow: '0 18px 48px rgba(0,0,0,0.28)',
                }}
              >
                <img src={logoUrl} alt="Dat3Night logo" width="72" height="72" />
              </div>
              <span>Dat3Night</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  color: '#ffffff',
                  fontSize: '64px',
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: '-2px',
                }}
              >
                Plan the perfect date night.
              </h1>
              <p
                style={{
                  margin: 0,
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '27px',
                  lineHeight: 1.4,
                }}
              >
                AI-powered restaurant, drinks, and activity recommendations tailored to your vibe.
              </p>
            </div>
          </div>
          <div
            style={{
              width: '280px',
              height: '280px',
              borderRadius: '48px',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.32)',
              overflow: 'hidden',
            }}
          >
            <img src={logoUrl} alt="Dat3Night app icon" width="280" height="280" />
          </div>
        </div>
      </div>
    ),
    size,
  )
}