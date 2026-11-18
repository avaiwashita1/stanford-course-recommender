// Claude client, routed through the Hopscotch gateway.
// Set HOPSCOTCH_API_KEY (server-side only). HOPSCOTCH_BASE_URL is optional.
import Anthropic from "@anthropic-ai/sdk";

export function createClaudeClient(): Anthropic {
  return new Anthropic({
    // The SDK appends /v1 itself, so accept the base URL with or without it.
    baseURL: (process.env.HOPSCOTCH_BASE_URL ?? "https://api.hopscotchlabs.ai").replace(/\/v1\/?$/, ""),
    // Hopscotch expects the key as a Bearer token. The fallback value only works inside
    // environments where a proxy injects the real credential.
    authToken: process.env.HOPSCOTCH_API_KEY ?? "injected-by-proxy",
    apiKey: null,
  });
}

/** Models are named "provider/model" on Hopscotch. */
export const MODELS = {
  prereqParser: process.env.PREREQ_MODEL ?? "anthropic/claude-sonnet-5",
} as const;
