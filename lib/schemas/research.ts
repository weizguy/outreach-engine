import { z } from "zod";

export const researchRequestSchema = z.object({
  url: z.url("A valid URL is required"),
  userId: z.string().min(1).optional(),
});

export type ResearchRequest = z.infer<typeof researchRequestSchema>;
