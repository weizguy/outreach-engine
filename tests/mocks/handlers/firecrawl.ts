import { http, HttpResponse } from 'msw'
import jobPostFixture from '../../fixtures/job-post-scraped.json'
import companySiteFixture from '../../fixtures/company-site-scraped.json'

export const firecrawlHandlers = [
  http.post('https://api.firecrawl.dev/v1/scrape', async ({ request }) => {
    const body = await request.json() as { url: string }
    const url = body?.url ?? ''

    // Return company site fixture for company URLs, job post for everything else
    const isCompanySite =
      !url.includes('greenhouse.io') &&
      !url.includes('lever.co') &&
      !url.includes('linkedin.com/jobs') &&
      !url.includes('workable.com') &&
      !url.includes('indeed.com')

    const fixture = isCompanySite ? companySiteFixture : jobPostFixture

    return HttpResponse.json({
      success: true,
      data: {
        markdown: fixture.markdown,
        metadata: { title: fixture.title, sourceURL: url },
      },
    })
  }),
]