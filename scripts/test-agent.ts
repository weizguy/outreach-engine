#!/usr/bin/env tsx
/**
 * Live E2E test script — makes real API calls to Firecrawl + Bedrock.
 *
 * Usage:
 *   npx tsx scripts/test-agent.ts <url>
 *   npx tsx scripts/test-agent.ts https://boards.greenhouse.io/acmecorp/jobs/12345
 *
 * Requires .env.local to be populated with real credentials.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local before importing anything that needs env vars
config({ path: resolve(process.cwd(), '.env.local') })

import { runResearchLoop } from '../lib/ai/agent'

const url = process.argv[2]

if (!url) {
  console.error('Usage: npx tsx scripts/test-agent.ts <url>')
  process.exit(1)
}

console.log(`\n🔍 Running research loop for: ${url}\n`)
console.log('─'.repeat(60))

try {
  const start = Date.now()
  const result = await runResearchLoop(url)
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log(`\n✅ Done in ${elapsed}s\n`)

  console.log('📊 SIGNALS')
  console.log('─'.repeat(40))
  console.log(JSON.stringify(result.signals, null, 2))

  console.log('\n🎯 SCORE')
  console.log('─'.repeat(40))
  console.log(`Stack match:     ${result.score.stackMatch}/100`)
  console.log(`Growth signal:   ${result.score.growthSignal}/100`)
  console.log(`Seniority fit:   ${result.score.seniorityFit}/100`)
  console.log(`Overall:         ${result.score.overallScore}/100`)

  console.log('\n✉️  DRAFT MESSAGE')
  console.log('─'.repeat(40))
  console.log(result.draftMessage)

  const wordCount = result.draftMessage.trim().split(/\s+/).length
  console.log(`\n(${wordCount} words)`)

} catch (err) {
  console.error('\n❌ Error:', err)
  process.exit(1)
}
