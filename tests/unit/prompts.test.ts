import { describe, it, expect } from 'vitest'
import {
  buildExtractionPrompt,
  buildScoringPrompt,
  buildDraftPrompt,
} from '@/lib/ai/prompts'
import type { VoiceSample } from '@/lib/ai/types'

const scrapedContent = `# Senior Full-Stack Engineer at Acme Corp
Next.js, TypeScript, Node.js, PostgreSQL. Contact: sarah.chen@acmecorp.com`

const extractedSignals = {
  companyName: 'Acme Corp',
  roleTitle: 'Senior Full-Stack Engineer',
  techStack: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
  managerName: 'Sarah Chen',
  managerTitle: 'CTO',
  recentNews: 'Raised $12M Series A',
  mostInterestingSignal: 'Engineering team doubled last quarter',
}

const voiceSamples: VoiceSample[] = [
  {
    id: '1',
    text: 'Saw you shipped the new auth system last week — that kind of end-to-end ownership is exactly what I look for in a team. I\'m a full-stack JS dev looking for my next role. 15 minutes?',
    notes: 'Got a reply within 2 hours',
  },
  {
    id: '2',
    text: 'Your engineering blog post on the PostgreSQL migration was the clearest write-up I\'ve seen on that problem. I work in the same stack — Next.js, Node, Postgres. Would love a quick call.',
    notes: 'No reply, but felt right',
  },
]

// ─────────────────────────────────────────────
// Extraction prompt
// ─────────────────────────────────────────────

describe('buildExtractionPrompt', () => {
  it('includes the scraped content', () => {
    const prompt = buildExtractionPrompt(scrapedContent)
    expect(prompt).toContain('Senior Full-Stack Engineer')
    expect(prompt).toContain('sarah.chen@acmecorp.com')
  })

  it('asks for JSON output', () => {
    const prompt = buildExtractionPrompt(scrapedContent)
    expect(prompt.toLowerCase()).toContain('json')
  })

  it('asks for the fields defined in the spec', () => {
    const prompt = buildExtractionPrompt(scrapedContent)
    expect(prompt).toContain('companyName')
    expect(prompt).toContain('techStack')
    expect(prompt).toContain('managerName')
    expect(prompt).toContain('recentNews')
  })

  it('does not exceed a reasonable token budget', () => {
    // Rough token estimate: 1 token ≈ 4 chars
    const estimatedTokens = buildExtractionPrompt(scrapedContent).length / 4
    expect(estimatedTokens).toBeLessThan(8000)
  })
})

// ─────────────────────────────────────────────
// Scoring prompt
// ─────────────────────────────────────────────

describe('buildScoringPrompt', () => {
  it('includes all three scoring dimensions', () => {
    const prompt = buildScoringPrompt(extractedSignals)
    expect(prompt).toContain('stackMatch')
    expect(prompt).toContain('growthSignal')
    expect(prompt).toContain('seniorityFit')
  })

  it('includes the extracted signals', () => {
    const prompt = buildScoringPrompt(extractedSignals)
    expect(prompt).toContain('Acme Corp')
    expect(prompt).toContain('Next.js')
  })

  it('mentions the 40/35/25 weighting', () => {
    const prompt = buildScoringPrompt(extractedSignals)
    expect(prompt).toMatch(/40|35|25/)
  })

  it('asks for JSON output', () => {
    const prompt = buildScoringPrompt(extractedSignals)
    expect(prompt.toLowerCase()).toContain('json')
  })
})

// ─────────────────────────────────────────────
// Draft prompt
// ─────────────────────────────────────────────

describe('buildDraftPrompt', () => {
  it('includes all voice samples', () => {
    const prompt = buildDraftPrompt(extractedSignals, voiceSamples)
    expect(prompt).toContain('auth system')
    expect(prompt).toContain('PostgreSQL migration')
  })

  it('includes the most interesting signal', () => {
    const prompt = buildDraftPrompt(extractedSignals, voiceSamples)
    expect(prompt).toContain('Engineering team doubled last quarter')
  })

  it('enforces the 100-word limit', () => {
    const prompt = buildDraftPrompt(extractedSignals, voiceSamples)
    expect(prompt).toContain('100 words')
  })

  it('instructs not to start with a name introduction', () => {
    const prompt = buildDraftPrompt(extractedSignals, voiceSamples)
    expect(prompt.toLowerCase()).toMatch(/don't start|do not start|never start/)
  })

  it('mentions the 15-minute call ask', () => {
    const prompt = buildDraftPrompt(extractedSignals, voiceSamples)
    expect(prompt).toContain('15-minute')
  })

  it('works with zero voice samples without crashing', () => {
    expect(() => buildDraftPrompt(extractedSignals, [])).not.toThrow()
  })

  it('includes a note about sounding human when no voice samples exist', () => {
    const prompt = buildDraftPrompt(extractedSignals, [])
    expect(prompt.toLowerCase()).toMatch(/human|natural|conversational/)
  })
})
