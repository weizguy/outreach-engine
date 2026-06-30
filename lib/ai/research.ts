import type { ResearchRequest } from "@/lib/schemas/research";

export type ResearchResult = {
  sourceUrl: string;
  status: "stub";
  message: string;
};

export async function runResearch(
  input: ResearchRequest,
): Promise<ResearchResult> {
  return {
    sourceUrl: input.url,
    status: "stub",
    message: "Research agent not yet implemented",
  };
}
