export type UrlSourceType = "job_post" | "linkedin_profile" | "company_site";

export type VoiceSampleInput = {
  text: string;
  notes: string | null;
};

export type DraftMessageSignals = {
  companyName: string;
  roleTitle: string;
  managerName: string | null;
  mostInterestingSignal: string;
  stackOverlap: string[];
};

export const DEFAULT_DEVELOPER_STACK = [
  "Next.js",
  "Node",
  "TypeScript",
  "PostgreSQL",
  "NestJS",
  "Prisma",
  "AWS",
] as const;

export function parseInputPrompt(url: string): string {
  return `You will receive a URL. Determine if it is:
- A job posting (LinkedIn Jobs, Greenhouse, Lever, Workable, Indeed, etc.)
- A LinkedIn profile URL
- A company website

URL: ${url}

Return JSON: { type: 'job_post' | 'linkedin_profile' | 'company_site', platform: string }`;
}

export function signalExtractionPrompt(scrapedContent: string): string {
  return `Given the following scraped content from a job posting and company website,
extract the following signals:

- Company name and one-sentence description
- Tech stack mentioned (languages, frameworks, tools)
- Engineering team size (if mentioned)
- Recent company news or product launches
- Hiring manager name and title (if in posting)
- Any specific problems or challenges mentioned in the role description
- Company growth indicators (hiring volume, funding mentions)

Scraped content:
${scrapedContent}

Return as structured JSON.`;
}

export function opportunityScoringPrompt(params: {
  extractedSignals: string;
  developerStack: readonly string[];
}): string {
  const stackList = params.developerStack.join(", ");

  return `Given these extracted signals and the developer's target stack:
${stackList}

Extracted signals:
${params.extractedSignals}

Score this opportunity:
- stackMatch (0-100): how well does the role's tech stack match?
- growthSignal (0-100): how strong are the company's growth indicators?
- seniorityFit (0-100): how well does the role level match a senior full-stack JS developer?

Return JSON with scores and a one-sentence rationale for each.`;
}

export function formatVoiceContext(voiceSamples: VoiceSampleInput[]): string {
  return voiceSamples
    .map(
      (sample) =>
        `MESSAGE:\n${sample.text}\nNOTES: ${sample.notes ?? "none"}`,
    )
    .join("\n\n---\n\n");
}

export function draftMessagePrompt(params: {
  voiceContext: string;
  signals: DraftMessageSignals;
}): string {
  const { voiceContext, signals } = params;
  const stackOverlap = signals.stackOverlap.join(", ");

  return `You are writing a cold outreach message on behalf of Dave, a full-stack JavaScript developer.

Dave's voice — examples of messages he has written:
${voiceContext}

Study the tone, length, word choices, and structure of those examples carefully.
The output must sound like Dave wrote it, not like an AI wrote it.

Context about this opportunity:
- Company: ${signals.companyName}
- Role: ${signals.roleTitle}
- Hiring manager: ${signals.managerName ?? "unknown"}
- Key insight to reference: ${signals.mostInterestingSignal}
- Tech stack overlap: ${stackOverlap}

Rules:
- Under 100 words
- First line must reference something specific about the company or person (not generic)
- Mention his stack naturally (Next.js, Node, TypeScript, AI features in production)
- End with a low-pressure ask for a 15-minute call
- No subject line needed (this is a LinkedIn DM)
- Do NOT start with "Hi, I'm Dave" or any variant — get to the specific thing first

Write the message only. No preamble, no explanation.`;
}
