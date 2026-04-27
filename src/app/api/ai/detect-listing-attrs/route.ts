import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
// Haiku 4.5 is plenty for short structured extraction; ~10x cheaper and
// ~5x faster than Sonnet. Tool use guarantees JSON shape.
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

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { title?: unknown; description?: unknown };
  try {
    body = (await req.json()) as { title?: unknown; description?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (title.length === 0 && description.length === 0) {
    return NextResponse.json({ platform: null, region: null });
  }

  // Cap input so we don't pay for runaway pasted novels in description.
  const truncatedTitle = title.slice(0, 200);
  const truncatedDescription = description.slice(0, 4000);

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
          content: `Title: ${truncatedTitle}\n\nDescription: ${truncatedDescription}`,
        },
      ],
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    console.warn("[detect-listing-attrs] upstream error:", text);
    return NextResponse.json(
      { error: "Detection unavailable", platform: null, region: null },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as {
    content?: Array<{ type: string; input?: { platform?: unknown; region?: unknown } }>;
  };
  const tool = data.content?.find((c) => c.type === "tool_use");
  const input = tool?.input ?? {};

  return NextResponse.json({
    platform: typeof input.platform === "string" ? input.platform : null,
    region: typeof input.region === "string" ? input.region : null,
  });
}
