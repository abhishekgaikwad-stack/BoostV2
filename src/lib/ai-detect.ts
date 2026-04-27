import "server-only";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const TOOL = {
  name: "extract_listing_attrs",
  description:
    "Extract the gaming platform and region from a marketplace listing for a game account. Both fields are optional — return null when the text doesn't clearly indicate a value.",
  input_schema: {
    type: "object",
    properties: {
      platform: {
        type: ["string", "null"],
        description:
          "The platform the account runs on. Normalize to one of: PC, PS5, PS4, Xbox, Xbox Series, Switch, Mobile, iOS, Android. If multiple are mentioned, pick the most prominent. Null if not stated.",
      },
      region: {
        type: ["string", "null"],
        description:
          "The account's region/server. Normalize to one of: NA, EU, Asia, SA, OCE, Global. Null if not stated.",
      },
    },
    required: ["platform", "region"],
    additionalProperties: false,
  },
} as const;

const SYSTEM_PROMPT =
  "You read game-account marketplace listing copy and extract the platform and region. Be conservative — if either is not clearly stated, return null for that field. Use the normalized labels in the tool's input schema.";

export type DetectedAttrs = {
  platform: string | null;
  region: string | null;
};

export type DetectResult =
  | { ok: true; attrs: DetectedAttrs }
  | {
      ok: false;
      error: string;
      upstreamStatus?: number;
      upstreamBody?: string;
    };

/**
 * Server-only wrapper around Claude Haiku 4.5 with a strict tool-use call
 * that guarantees JSON shape. Used by the seller form's blur-trigger and by
 * the bulk-upload action when CSV rows leave platform/region blank.
 *
 * Inputs are truncated so a pasted novel in description can't run up the
 * bill. Empty input short-circuits — no API call, just nulls.
 */
export async function detectListingAttrs(input: {
  title: string;
  description: string;
}): Promise<DetectResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY is not configured." };
  }

  const title = input.title.slice(0, 200).trim();
  const description = input.description.slice(0, 4000).trim();
  if (title.length === 0 && description.length === 0) {
    return { ok: true, attrs: { platform: null, region: null } };
  }

  const upstream = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [
        {
          role: "user",
          content: `Title: ${title}\n\nDescription: ${description}`,
        },
      ],
    }),
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return {
      ok: false,
      error: "Detection unavailable",
      upstreamStatus: upstream.status,
      upstreamBody: body,
    };
  }

  const data = (await upstream.json()) as {
    content?: Array<{
      type: string;
      input?: { platform?: unknown; region?: unknown };
    }>;
  };
  const tool = data.content?.find((c) => c.type === "tool_use");
  const toolInput = tool?.input ?? {};

  return {
    ok: true,
    attrs: {
      platform:
        typeof toolInput.platform === "string" ? toolInput.platform : null,
      region: typeof toolInput.region === "string" ? toolInput.region : null,
    },
  };
}
