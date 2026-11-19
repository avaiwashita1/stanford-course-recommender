// The two AI steps of the recommendation pipeline. Everything else is deterministic code.
import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createClaudeClient, MODELS } from "@/lib/ai/client";
import { KEYWORDS_SYSTEM_PROMPT, RANK_SYSTEM_PROMPT } from "./prompts";

const KeywordsSchema = z.object({ keywords: z.array(z.string()) });
const RankSchema = z.object({
  recommendations: z.array(z.object({ courseId: z.string(), reason: z.string() })),
});

export interface RankCandidate {
  courseId: string;
  title: string;
  units: string;
  quarters: string[];
  description: string;
}

export type Ranked = z.infer<typeof RankSchema>["recommendations"];

function ensureCompleted(stopReason: string | null): void {
  if (stopReason === "refusal") throw new Error("The AI model declined this request.");
  if (stopReason !== "end_turn") throw new Error(`The AI response was cut off (${stopReason}).`);
}

export async function generateKeywords(interests: string): Promise<string[]> {
  const response = await createClaudeClient().messages.parse({
    model: MODELS.recommender,
    max_tokens: 4000,
    system: KEYWORDS_SYSTEM_PROMPT,
    output_config: { effort: "low", format: zodOutputFormat(KeywordsSchema) },
    messages: [{ role: "user", content: `Student's interests:\n<interests>\n${interests}\n</interests>` }],
  });
  ensureCompleted(response.stop_reason);
  return response.parsed_output?.keywords ?? [];
}

export async function rankCandidates(interests: string, candidates: RankCandidate[]): Promise<Ranked> {
  const response = await createClaudeClient().messages.parse({
    model: MODELS.recommender,
    max_tokens: 8000,
    system: RANK_SYSTEM_PROMPT,
    output_config: { effort: "medium", format: zodOutputFormat(RankSchema) },
    messages: [
      {
        role: "user",
        content: `Student's interests:\n<interests>\n${interests}\n</interests>\n\nCandidate courses (${candidates.length}):\n${JSON.stringify(candidates)}`,
      },
    ],
  });
  ensureCompleted(response.stop_reason);
  return response.parsed_output?.recommendations ?? [];
}
