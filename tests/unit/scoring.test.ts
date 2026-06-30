import { describe, it, expect } from 'vitest'
import {
  scoreOpportunity,
  calculateStackMatch,
  calculateGrowthSignal,
  calculateSeniorityFit,
  DAVE_STACK,
} from '@/lib/ai/scoring'
import type { ExtractedSignals } from '@/lib/ai/types'

// Base fixture — strong match across all dimensions
const strongMatch: ExtractedSignals = {
  companyName: 'Acme Corp',
  companySummary: 'B2B SaaS analytics platform',
  roleTitle: 'Senior Full-Stack Engineer',
  managerName: 'Sarah Chen',
  managerTitle: 'CTO',
  managerEmail: 'sarah.chen@acmecorp.com',
  techStack: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'AWS'],
  teamSize: 8,
  companySize: 30,
  recentNews: 'Raised $12M Series A in March 2024',
  aiMentioned: true,
  mostInterestingSignal: 'Engineering team doubled last quarter',
}

// Weak stack match — different tech entirely
const weakStackMatch: ExtractedSignals = {
  ...strongMatch,
  techStack: ['Ruby on Rails', 'MySQL', 'Redis', 'Sidekiq'],
  aiMentioned: false,
}

// No growth signals
const noGrowthSignals: ExtractedSignals = {
  ...strongMatch,
  recentNews: null,
  companySize: null,
  teamSize: null,
}

// Junior role
const juniorRole: ExtractedSignals = {
  ...strongMatch,
  roleTitle: 'Junior Frontend Developer',
}

// Staff/principal role (too senior)
const staffRole: ExtractedSignals = {
  ...strongMatch,
  roleTitle: 'Staff Engineer',
}

// Missing fields — should not crash
const minimalSignals: ExtractedSignals = {
  companyName: 'Unknown Corp',
  companySummary: null,
  roleTitle: 'Software Engineer',
  managerName: null,
  managerTitle: null,
  managerEmail: null,
  techStack: [],
  teamSize: null,
  companySize: null,
  recentNews: null,
  aiMentioned: false,
  mostInterestingSignal: null,
}

// ─────────────────────────────────────────────
// Stack match
// ─────────────────────────────────────────────

describe('calculateStackMatch', () => {
  it('returns a high score for a near-perfect stack match', () => {
    const score = calculateStackMatch(strongMatch.techStack)
    expect(score).toBeGreaterThanOrEqual(80)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns a low score for a completely different stack', () => {
    const score = calculateStackMatch(weakStackMatch.techStack)
    expect(score).toBeLessThan(20)
  })

  it('returns 0 for an empty stack', () => {
    const score = calculateStackMatch([])
    expect(score).toBe(0)
  })

  it('is case-insensitive', () => {
    const lowercase = calculateStackMatch(['next.js', 'typescript', 'node.js'])
    const uppercase = calculateStackMatch(['Next.js', 'TypeScript', 'Node.js'])
    expect(lowercase).toBe(uppercase)
  })

  it('gives a bonus when AI/LLM tech is present', () => {
    const withAI = calculateStackMatch([...DAVE_STACK, 'OpenAI', 'LangChain'])
    const withoutAI = calculateStackMatch(DAVE_STACK)
    expect(withAI).toBeGreaterThan(withoutAI)
  })

  it('caps at 100 even with an oversized matching stack', () => {
    const bigStack = [...DAVE_STACK, 'OpenAI', 'LangChain', 'Pinecone', 'Vercel', 'Redis']
    const score = calculateStackMatch(bigStack)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─────────────────────────────────────────────
// Growth signal
// ─────────────────────────────────────────────

describe('calculateGrowthSignal', () => {
  it('returns a high score for a company with recent funding and news', () => {
    const score = calculateGrowthSignal(strongMatch)
    expect(score).toBeGreaterThanOrEqual(70)
  })

  it('returns a mid score when some signals are present', () => {
    const partialSignals: ExtractedSignals = {
      ...strongMatch,
      recentNews: 'Launched new product tier',
      companySize: 25,
    }
    const score = calculateGrowthSignal(partialSignals)
    expect(score).toBeGreaterThan(30)
    expect(score).toBeLessThan(90)
  })

  it('returns a low but non-zero score when no growth signals are present', () => {
    const score = calculateGrowthSignal(noGrowthSignals)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThan(40)
  })

  it('never returns a negative score', () => {
    const score = calculateGrowthSignal(minimalSignals)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

// ─────────────────────────────────────────────
// Seniority fit
// ─────────────────────────────────────────────

describe('calculateSeniorityFit', () => {
  it('returns a high score for a senior IC role', () => {
    const score = calculateSeniorityFit(strongMatch.roleTitle)
    expect(score).toBeGreaterThanOrEqual(75)
  })

  it('returns a low score for a junior role', () => {
    const score = calculateSeniorityFit(juniorRole.roleTitle)
    expect(score).toBeLessThan(40)
  })

  it('returns a moderate score for a staff/principal role', () => {
    // Too senior is still a partial fit — Dave could grow into it
    const score = calculateSeniorityFit(staffRole.roleTitle)
    expect(score).toBeGreaterThan(30)
    expect(score).toBeLessThan(80)
  })

  it('handles ambiguous titles without crashing', () => {
    const score = calculateSeniorityFit('Software Engineer')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('handles an empty role title', () => {
    const score = calculateSeniorityFit('')
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

// ─────────────────────────────────────────────
// Composite score
// ─────────────────────────────────────────────

describe('scoreOpportunity', () => {
  it('returns all four score fields', () => {
    const result = scoreOpportunity(strongMatch)
    expect(result).toHaveProperty('stackMatch')
    expect(result).toHaveProperty('growthSignal')
    expect(result).toHaveProperty('seniorityFit')
    expect(result).toHaveProperty('overallScore')
  })

  it('computes overallScore as the weighted average (40/35/25)', () => {
    const result = scoreOpportunity(strongMatch)
    const expected = Math.round(
      result.stackMatch * 0.4 +
      result.growthSignal * 0.35 +
      result.seniorityFit * 0.25
    )
    expect(result.overallScore).toBe(expected)
  })

  it('returns a high overall score for a strong match', () => {
    const result = scoreOpportunity(strongMatch)
    expect(result.overallScore).toBeGreaterThanOrEqual(70)
  })

  it('returns a low overall score for a weak match', () => {
    const result = scoreOpportunity({ ...weakStackMatch, roleTitle: 'Junior Backend Developer' })
    expect(result.overallScore).toBeLessThan(40)
  })

  it('all scores are between 0 and 100', () => {
    const result = scoreOpportunity(strongMatch)
    expect(result.stackMatch).toBeGreaterThanOrEqual(0)
    expect(result.stackMatch).toBeLessThanOrEqual(100)
    expect(result.growthSignal).toBeGreaterThanOrEqual(0)
    expect(result.growthSignal).toBeLessThanOrEqual(100)
    expect(result.seniorityFit).toBeGreaterThanOrEqual(0)
    expect(result.seniorityFit).toBeLessThanOrEqual(100)
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
  })

  it('does not crash on minimal signals', () => {
    expect(() => scoreOpportunity(minimalSignals)).not.toThrow()
  })

  it('scores are integers', () => {
    const result = scoreOpportunity(strongMatch)
    expect(Number.isInteger(result.stackMatch)).toBe(true)
    expect(Number.isInteger(result.growthSignal)).toBe(true)
    expect(Number.isInteger(result.seniorityFit)).toBe(true)
    expect(Number.isInteger(result.overallScore)).toBe(true)
  })
})
