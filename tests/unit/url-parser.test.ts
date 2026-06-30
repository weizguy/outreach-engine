import { describe, it, expect } from 'vitest'
import { detectUrlType, extractCompanyUrl } from '@/lib/ai/url-parser'

describe('detectUrlType', () => {
  describe('job post URLs', () => {
    it('detects LinkedIn job posts', () => {
      expect(detectUrlType('https://www.linkedin.com/jobs/view/123456789')).toBe('JOB_POST')
    })

    it('detects Greenhouse job posts', () => {
      expect(detectUrlType('https://boards.greenhouse.io/acmecorp/jobs/12345')).toBe('JOB_POST')
    })

    it('detects Lever job posts', () => {
      expect(detectUrlType('https://jobs.lever.co/acmecorp/abc-123')).toBe('JOB_POST')
    })

    it('detects Workable job posts', () => {
      expect(detectUrlType('https://acmecorp.workable.com/jobs/12345')).toBe('JOB_POST')
    })

    it('detects Indeed job posts', () => {
      expect(detectUrlType('https://www.indeed.com/viewjob?jk=abc123')).toBe('JOB_POST')
    })

    it('detects Wellfound/AngelList job posts', () => {
      expect(detectUrlType('https://wellfound.com/jobs/12345-senior-engineer')).toBe('JOB_POST')
    })
  })

  describe('LinkedIn profile URLs', () => {
    it('detects a standard LinkedIn profile', () => {
      expect(detectUrlType('https://www.linkedin.com/in/sarah-chen')).toBe('LINKEDIN_PROFILE')
    })

    it('detects a LinkedIn profile without www', () => {
      expect(detectUrlType('https://linkedin.com/in/john-doe-123')).toBe('LINKEDIN_PROFILE')
    })

    it('does not confuse a LinkedIn company page with a profile', () => {
      expect(detectUrlType('https://www.linkedin.com/company/acmecorp')).not.toBe('LINKEDIN_PROFILE')
    })
  })

  describe('company site URLs', () => {
    it('detects a company homepage', () => {
      expect(detectUrlType('https://acmecorp.com')).toBe('COMPANY_SITE')
    })

    it('detects a company about page', () => {
      expect(detectUrlType('https://acmecorp.com/about')).toBe('COMPANY_SITE')
    })

    it('detects a company careers page', () => {
      expect(detectUrlType('https://acmecorp.com/careers')).toBe('COMPANY_SITE')
    })
  })

  describe('edge cases', () => {
    it('throws on an empty string', () => {
      expect(() => detectUrlType('')).toThrow()
    })

    it('throws on a non-URL string', () => {
      expect(() => detectUrlType('not a url')).toThrow()
    })

    it('handles URLs with trailing slashes', () => {
      expect(detectUrlType('https://www.linkedin.com/in/sarah-chen/')).toBe('LINKEDIN_PROFILE')
    })

    it('handles URLs with query params', () => {
      expect(detectUrlType('https://boards.greenhouse.io/acme/jobs/123?gh_src=abc')).toBe('JOB_POST')
    })
  })
})

describe('extractCompanyUrl', () => {
  it('extracts company URL from a Greenhouse posting', () => {
    const url = extractCompanyUrl(
      'JOB_POST',
      'https://boards.greenhouse.io/acmecorp/jobs/12345',
      { companyName: 'Acme Corp', companyWebsite: 'https://acmecorp.com' }
    )
    expect(url).toBe('https://acmecorp.com')
  })

  it('returns null when no company URL is available', () => {
    const url = extractCompanyUrl(
      'JOB_POST',
      'https://boards.greenhouse.io/acmecorp/jobs/12345',
      { companyName: 'Acme Corp', companyWebsite: null }
    )
    expect(url).toBeNull()
  })

  it('returns the URL directly for a company site input', () => {
    const url = extractCompanyUrl(
      'COMPANY_SITE',
      'https://acmecorp.com/careers',
      {}
    )
    expect(url).toBe('https://acmecorp.com/careers')
  })
})
