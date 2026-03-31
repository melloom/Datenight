import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const title = searchParams.get('title') || 'Date Night Planner'
  const location = searchParams.get('location') || ''
  const vibes = searchParams.get('vibes') || ''
  const venues = searchParams.get('venues') || ''
  const date = searchParams.get('date') || ''

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
          background: 'linear-gradient(135deg, #1a1025 0%, #2d1b4e 40%, #1a1025 100%)',
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
            background: 'radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
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
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '28px' }}>💜</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.5px' }}>
              Date Night Planner
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
              {title}
            </h1>

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
              datenight.app
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
