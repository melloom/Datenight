import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = request.nextUrl.origin

  const title = searchParams.get('title') || 'Date Night Planner'
  const location = searchParams.get('location') || ''
  const vibes = searchParams.get('vibes') || ''
  const venues = searchParams.get('venues') || ''
  const date = searchParams.get('date') || ''

  // Get the current domain from the request
  const host = request.headers.get('host') || 'datenight.app'
  const logoUrl = `${origin}/apple-touch-icon.png`

  // Parse venue names
  const venueList = venues ? venues.split('|').slice(0, 3) : []
  const vibeList = vibes ? vibes.split(',').slice(0, 4) : []

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #12091b 0%, #2a1241 45%, #140a1f 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 18% 18%, rgba(236, 72, 153, 0.18) 0%, transparent 48%), radial-gradient(circle at 82% 82%, rgba(251, 191, 36, 0.14) 0%, transparent 44%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            flex: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo + Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '22px',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 18px 48px rgba(0,0,0,0.28)',
                border: '1px solid rgba(255,255,255,0.12)',
                overflow: 'hidden',
              }}
            >
              <img
                src={logoUrl}
                alt="Dat3Night logo"
                width="84"
                height="84"
                style={{ display: 'flex' }}
              />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.5px' }}>
              Dat3Night
            </span>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <h1
              style={{
                fontSize: venueList.length > 0 ? '48px' : '56px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-1px',
                margin: 0,
              }}
            >
              {venueList.length > 0 ? title : 'Plan the perfect date night with Dat3Night'}
            </h1>

            {!venueList.length && (
              <p
                style={{
                  fontSize: '24px',
                  lineHeight: 1.45,
                  color: 'rgba(255,255,255,0.78)',
                  margin: '16px 0 0 0',
                  maxWidth: '860px',
                }}
              >
                AI-powered recommendations for restaurants, drinks, and memorable plans built around your vibe.
              </p>
            )}

            {/* Location + Date */}
            {(location || date) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px' }}>
                {location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>📍</span>
                    <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                      {location}
                    </span>
                  </div>
                )}
                {date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>📅</span>
                    <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                      {date}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Vibes */}
            {vibeList.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                {vibeList.map((vibe) => (
                  <span
                    key={vibe}
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#e9d5ff',
                      background: 'rgba(168, 85, 247, 0.25)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      borderRadius: '20px',
                      padding: '6px 18px',
                    }}
                  >
                    {vibe.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Venue Cards */}
            {venueList.length > 0 && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                {venueList.map((venue, i) => {
                  const icons = ['🍸', '🍽️', '✨']
                  const labels = ['Drinks', 'Dinner', 'Activity']
                  const gradients = [
                    'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(251, 146, 60, 0.2))',
                    'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 179, 8, 0.2))',
                    'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))',
                  ]
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: gradients[i] || gradients[2],
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        flex: 1,
                        maxWidth: '340px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {icons[i]} {labels[i] || 'Stop ' + (i + 1)}
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        {venue}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {host}
            </span>
            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              AI-Powered Date Planning
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
