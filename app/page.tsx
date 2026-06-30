'use client'

import { useState } from 'react'

const EXAMPLE_URLS = [
  'https://boards.greenhouse.io/acmecorp/jobs/12345',
  'https://www.linkedin.com/in/sarah-chen',
  'https://jobs.lever.co/acmecorp/abc-123',
]

const PIPELINE_STEPS = [
  'Scraping job post...',
  'Researching company...',
  'Extracting signals...',
  'Scoring opportunity...',
  'Drafting message...',
]

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const placeholderUrl = EXAMPLE_URLS[0]

  async function handleResearch() {
    if (!url.trim()) return
    setState('running')
    setCurrentStep(0)
    setCompletedSteps([])

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setCurrentStep(i)
      await new Promise(r => setTimeout(r, 900 + Math.random() * 400))
      setCompletedSteps(prev => [...prev, i])
    }

    setState('done')
  }

  function handleReset() {
    setState('idle')
    setCurrentStep(0)
    setCompletedSteps([])
    setUrl('')
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0A0F1E',
      color: '#F0F2F8',
      fontFamily: '"Inter", system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: '#F0F2F8',
        }}>
          outreach<span style={{ color: '#3B7EF6' }}>engine</span>
        </span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/dashboard" style={{
            fontSize: '13px',
            color: 'rgba(240,242,248,0.5)',
            textDecoration: 'none',
          }}>Dashboard</a>
          <a href="/settings" style={{
            fontSize: '13px',
            color: 'rgba(240,242,248,0.5)',
            textDecoration: 'none',
          }}>Settings</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
      }}>

        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(59,126,246,0.1)',
          border: '1px solid rgba(59,126,246,0.25)',
          borderRadius: '100px',
          padding: '5px 14px',
          marginBottom: '36px',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#3B7EF6',
            display: 'inline-block',
          }} />
          <span style={{
            fontSize: '12px',
            color: '#3B7EF6',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.04em',
          }}>
            AI-powered outreach
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)',
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          maxWidth: '760px',
          marginBottom: '20px',
          color: '#F0F2F8',
        }}>
          Your first line,<br />
          <span style={{ color: '#3B7EF6' }}>researched and ready.</span>
        </h1>

        {/* Subhead */}
        <p style={{
          fontSize: '17px',
          lineHeight: 1.6,
          color: 'rgba(240,242,248,0.55)',
          maxWidth: '480px',
          marginBottom: '56px',
        }}>
          Paste a job post or LinkedIn profile. Outreach Engine researches the company,
          scores the opportunity, and drafts a message in your voice.
        </p>

        {/* Input area */}
        {state === 'idle' && (
          <div style={{
            width: '100%',
            maxWidth: '600px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
              onFocus={() => {}}
            >
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResearch()}
                placeholder={placeholderUrl}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '14px 18px',
                  fontSize: '13px',
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  color: '#F0F2F8',
                  letterSpacing: '-0.01em',
                }}
              />
              <button
                onClick={handleResearch}
                disabled={!url.trim()}
                style={{
                  background: url.trim() ? '#3B7EF6' : 'rgba(59,126,246,0.3)',
                  border: 'none',
                  padding: '14px 22px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: url.trim() ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: url.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                Research →
              </button>
            </div>
            <p style={{
              fontSize: '12px',
              color: 'rgba(240,242,248,0.3)',
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              Greenhouse · Lever · LinkedIn · Workable · Wellfound · and more
            </p>
          </div>
        )}

        {/* Pipeline animation */}
        {state === 'running' && (
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '28px 32px',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: '11px',
              fontFamily: '"JetBrains Mono", monospace',
              color: 'rgba(240,242,248,0.35)',
              marginBottom: '20px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              Running research loop
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {PIPELINE_STEPS.map((step, i) => {
                const isDone = completedSteps.includes(i)
                const isActive = currentStep === i && !isDone
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: i > currentStep ? 0.25 : 1,
                    transition: 'opacity 0.3s',
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isDone
                        ? 'none'
                        : `1.5px solid ${isActive ? '#3B7EF6' : 'rgba(255,255,255,0.2)'}`,
                      background: isDone ? '#3B7EF6' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}>
                      {isDone && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {isActive && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#3B7EF6',
                          animation: 'pulse 1s ease-in-out infinite',
                        }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontFamily: '"JetBrains Mono", monospace',
                      color: isDone
                        ? 'rgba(240,242,248,0.6)'
                        : isActive
                          ? '#F0F2F8'
                          : 'rgba(240,242,248,0.3)',
                      transition: 'color 0.2s',
                    }}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Done state */}
        {state === 'done' && (
          <div style={{
            width: '100%',
            maxWidth: '560px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{
              background: 'rgba(59,126,246,0.08)',
              border: '1px solid rgba(59,126,246,0.2)',
              borderRadius: '12px',
              padding: '24px 28px',
              textAlign: 'left',
            }}>
              <p style={{
                fontSize: '11px',
                fontFamily: '"JetBrains Mono", monospace',
                color: '#3B7EF6',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}>
                Draft message ready
              </p>
              <p style={{
                fontSize: '15px',
                lineHeight: 1.65,
                color: 'rgba(240,242,248,0.85)',
              }}>
                Saw your engineering team doubled last quarter while shipping the AI analytics pipeline.
                That's the kind of growth that makes the work interesting. I'm a full-stack JS dev
                (Next.js, Node, TypeScript, PostgreSQL) who's been building AI-powered features in
                production solo. Would love a 15-minute call if the timing works — no pressure if not.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="/dashboard" style={{
                flex: 1,
                background: '#3B7EF6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
              }}>
                Save to dashboard
              </a>
              <button
                onClick={handleReset}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(240,242,248,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        padding: '20px 40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: '12px',
          fontFamily: '"JetBrains Mono", monospace',
          color: 'rgba(240,242,248,0.2)',
        }}>
          outreach engine v0.1.0
        </span>
        <span style={{
          fontSize: '12px',
          color: 'rgba(240,242,248,0.2)',
        }}>
          Built by Weizguy
        </span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        input::placeholder { color: rgba(240,242,248,0.2); }
        a:hover { opacity: 0.8; }
        button:hover:not(:disabled) { opacity: 0.9; }
      `}</style>
    </main>
  )
}