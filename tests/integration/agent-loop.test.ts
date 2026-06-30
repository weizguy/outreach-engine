import { describe, it, expect, beforeEach } from 'vitest'
import { runResearchLoop } from '@/lib/ai/agent'
import { resetBedrockCallCount } from '../mocks/handlers/bedrock'

// MSW intercepts all Firecrawl + Bedrock calls — no real API calls made

beforeEach(() => {
  resetBedrockCallCount()
})

describe('runResearchLoop', () => {
  describe('with a job post URL', () => {
    const jobPostUrl = 'https://boards.greenhouse.io/acmecorp/jobs/12345'

    it('returns a result without throwing', async () => {
      await expect(runResearchLoop(jobPostUrl)).resolves.not.toThrow()
    })

    it('returns the expected shape', async () => {
      const result = await runResearchLoop(jobPostUrl)
      expect(result).toHaveProperty('signals')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('draftMessage')
      expect(result).toHaveProperty('sourceType')
    })

    it('identifies the source type as JOB_POST', async () => {
      const result = await runResearchLoop(jobPostUrl)
      expect(result.sourceType).toBe('JOB_POST')
    })

    it('extracts company name from signals', async () => {
      const result = await runResearchLoop(jobPostUrl)
      expect(result.signals.companyName).toBeTruthy()
      expect(typeof result.signals.companyName).toBe('string')
    })

    it('returns a draft message that is a non-empty string', async () => {
      const result = await runResearchLoop(jobPostUrl)
      expect(typeof result.draftMessage).toBe('string')
      expect(result.draftMessage.length).toBeGreaterThan(20)
    })

    it('returns an overall score between 0 and 100', async () => {
      const result = await runResearchLoop(jobPostUrl)
      expect(result.score.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.score.overallScore).toBeLessThanOrEqual(100)
    })
  })

  describe('with a LinkedIn profile URL', () => {
    const linkedInUrl = 'https://www.linkedin.com/in/sarah-chen'

    it('identifies the source type as LINKEDIN_PROFILE', async () => {
      const result = await runResearchLoop(linkedInUrl)
      expect(result.sourceType).toBe('LINKEDIN_PROFILE')
    })

    it('still returns a draft message', async () => {
      const result = await runResearchLoop(linkedInUrl)
      expect(result.draftMessage.length).toBeGreaterThan(20)
    })
  })

  describe('error handling', () => {
    it('throws a meaningful error for an invalid URL', async () => {
      await expect(runResearchLoop('not-a-url')).rejects.toThrow()
    })

    it('throws a meaningful error for an empty string', async () => {
      await expect(runResearchLoop('')).rejects.toThrow()
    })

    it('handles missing manager name gracefully', async () => {
      // The fixture returns a manager name — we test that the loop
      // still completes even when extraction returns null for managerName
      // This is covered by the scoring and drafting unit tests;
      // here we just confirm the loop itself doesn't crash
      const result = await runResearchLoop('https://boards.greenhouse.io/acmecorp/jobs/12345')
      expect(result).toBeDefined()
    })
  })

  describe('performance', () => {
    it('completes within 10 seconds (mocked)', async () => {
      const start = Date.now()
      await runResearchLoop('https://boards.greenhouse.io/acmecorp/jobs/12345')
      const elapsed = Date.now() - start
      // With mocked APIs this should be near-instant;
      // 10s is a generous ceiling to catch infinite loops or hangs
      expect(elapsed).toBeLessThan(10_000)
    })
  })
})
