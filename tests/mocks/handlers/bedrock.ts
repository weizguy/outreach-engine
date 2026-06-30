import { http, HttpResponse } from 'msw'
import extractedSignalsFixture from '../../fixtures/extracted-signals.json'
import scoredResultFixture from '../../fixtures/scored-result.json'
import draftMessageFixture from '../../fixtures/draft-message.json'

// Bedrock invoke endpoint pattern
const BEDROCK_URL = /https:\/\/bedrock-runtime\..+\.amazonaws\.com\/model\/.+\/invoke/

let callCount = 0

export const bedrockHandlers = [
  http.post(BEDROCK_URL, async () => {
    callCount++

    // The agent loop makes 3 Claude calls in order:
    // 1. Signal extraction
    // 2. Opportunity scoring
    // 3. Message drafting
    // Return the appropriate fixture based on call order
    let responseText: string

    if (callCount % 3 === 1) {
      responseText = JSON.stringify(extractedSignalsFixture)
    } else if (callCount % 3 === 2) {
      responseText = JSON.stringify(scoredResultFixture)
    } else {
      responseText = draftMessageFixture.message
    }

    // Bedrock response envelope for Claude models
    return HttpResponse.json({
      content: [{ type: 'text', text: responseText }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 50 },
    })
  }),
]

// Reset call count between tests
export const resetBedrockCallCount = () => { callCount = 0 }