import Firecrawl from 'firecrawl'

if (!process.env.FIRECRAWL_API_KEY) {
  throw new Error('FIRECRAWL_API_KEY is not set')
}

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY })

export interface ScrapeResult {
  title: string | null
  markdown: string
  sourceUrl: string
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  if (!url || !URL.canParse(url)) {
    throw new Error(`Invalid URL: "${url}"`)
  }

  const document = await firecrawl.scrape(url, {
    formats: ['markdown'],
  })

  return {
    title: document.metadata?.title ?? null,
    markdown: document.markdown ?? '',
    sourceUrl: url,
  }
}