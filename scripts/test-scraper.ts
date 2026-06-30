#!/usr/bin/env tsx
/**
 * Isolated Firecrawl scraper test — confirms scraping works before
 * running the full agent loop.
 *
 * Usage:
 *   npx tsx scripts/test-scraper.ts <url>
 *   npx tsx scripts/test-scraper.ts https://boards.greenhouse.io/acmecorp/jobs/12345
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

console.log('KEY:', process.env.FIRECRAWL_API_KEY)

// Dynamic import AFTER env is loaded
const { scrapeUrl } = await import('../lib/scraper.js')

const url = process.argv[2]

if (!url) {
  console.error('Usage: npx tsx scripts/test-scraper.ts <url>')
  process.exit(1)
}

console.log(`\n🌐 Scraping: ${url}\n`)
console.log('─'.repeat(60))

try {
  const start = Date.now()
  const result = await scrapeUrl(url)
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log(`✅ Scraped in ${elapsed}s`)
  console.log(`📄 Title: ${result.title ?? '(none)'}`)
  console.log(`📝 Content length: ${result.markdown.length} chars`)
  console.log(`\n--- First 1000 chars of markdown ---\n`)
  console.log(result.markdown.slice(0, 1000))

  if (result.markdown.length > 1000) {
    console.log(`\n... (${result.markdown.length - 1000} more chars)`)
  }

} catch (err) {
  console.error('\n❌ Scrape failed:', err)
  process.exit(1)
}