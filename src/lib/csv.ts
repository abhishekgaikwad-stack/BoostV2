import Papa from "papaparse";
import { PRICE_MAX_EUR } from "@/lib/utils";

// Headers the parser will accept. `platform` and `region` are *optional* —
// CSVs from before they existed still parse, and rows that leave them blank
// are passed to the AI auto-detect step in the bulk action.
export const BULK_HEADERS = [
  "game_slug",
  "title",
  "description",
  "platform",
  "region",
  "price_eur",
  "old_price_eur",
  "cred_login",
  "cred_password",
  "cred_email",
  "cred_email_password",
  "cred_notes",
] as const;

const REQUIRED_BULK_HEADERS: ReadonlyArray<(typeof BULK_HEADERS)[number]> = [
  "game_slug",
  "title",
  "description",
  "price_eur",
  "old_price_eur",
  "cred_login",
  "cred_password",
  "cred_email",
  "cred_email_password",
  "cred_notes",
];

export const BULK_MAX_ROWS = 500;

export type BulkListingRow = {
  title: string;
  description?: string;
  platform?: string;
  region?: string;
  priceEur: number;
  oldPriceEur?: number;
  credLogin?: string;
  credPassword?: string;
  credEmail?: string;
  credEmailPassword?: string;
  credNotes?: string;
};

export type ParsedBulkRow = {
  /** 1-based number including the header row — matches what the user sees. */
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
  valid: BulkListingRow | null;
};

export type ParseResult = {
  rows: ParsedBulkRow[];
  fileError?: string;
};

/**
 * Builds the downloadable template CSV. Prefills `game_slug` for the chosen
 * game and seeds one example row so sellers see the expected values at a
 * glance. All other cells are blank.
 */
export function buildTemplateCsv(gameSlug: string): string {
  return Papa.unparse(
    {
      fields: BULK_HEADERS as unknown as string[],
      data: [
        [
          gameSlug,
          "Example — 20M Valorant account (delete this row)",
          "Describe the account: agents, rank, warnings, anything the buyer should know.",
          "PC", // platform — leave blank to let auto-detect fill from title/description
          "NA", // region — leave blank to let auto-detect fill from title/description
          "40.20",
          "80.40",
          "",
          "",
          "",
          "",
          "",
        ],
      ],
    },
    { newline: "\n" },
  );
}

/**
 * Parses a CSV string and validates every row against the expected schema.
 * Header order doesn't matter — columns are looked up by name — but every
 * required header must exist.
 */
export function parseBulkCsv(
  csvText: string,
  expectedGameSlug: string,
): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_BULK_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      rows: [],
      fileError: `Missing column(s): ${missing.join(", ")}`,
    };
  }

  if (parsed.data.length === 0) {
    return { rows: [], fileError: "CSV has no data rows." };
  }
  if (parsed.data.length > BULK_MAX_ROWS) {
    return {
      rows: [],
      fileError: `Max ${BULK_MAX_ROWS} rows per upload. Your file has ${parsed.data.length}.`,
    };
  }

  const rows: ParsedBulkRow[] = parsed.data.map((raw, idx) => {
    const rowNumber = idx + 2; // +1 header + 1-based
    const errors: string[] = [];

    const get = (key: (typeof BULK_HEADERS)[number]) =>
      (raw[key] ?? "").trim();

    if (get("game_slug") !== expectedGameSlug) {
      errors.push(`game_slug must be "${expectedGameSlug}"`);
    }
    const title = get("title");
    if (!title) errors.push("title is required");
    if (title.length > 255) errors.push("title is too long (max 255)");

    const priceRaw = get("price_eur");
    const priceNum = Number.parseFloat(priceRaw);
    if (!priceRaw || !Number.isFinite(priceNum) || priceNum < 0) {
      errors.push("price_eur must be a positive number");
    } else if (priceNum > PRICE_MAX_EUR) {
      errors.push(`price_eur must be ≤ ${PRICE_MAX_EUR}`);
    }

    const oldPriceRaw = get("old_price_eur");
    let oldPriceNum: number | undefined;
    if (oldPriceRaw !== "") {
      oldPriceNum = Number.parseFloat(oldPriceRaw);
      if (!Number.isFinite(oldPriceNum) || oldPriceNum < 0) {
        errors.push("old_price_eur must be a positive number");
      } else if (Number.isFinite(priceNum) && oldPriceNum < priceNum) {
        errors.push("old_price_eur must be >= price_eur");
      }
    }

    const valid: BulkListingRow | null =
      errors.length === 0
        ? {
            title,
            description: get("description") || undefined,
            platform: get("platform") || undefined,
            region: get("region") || undefined,
            priceEur: priceNum,
            oldPriceEur: oldPriceNum,
            credLogin: get("cred_login") || undefined,
            credPassword: get("cred_password") || undefined,
            credEmail: get("cred_email") || undefined,
            credEmailPassword: get("cred_email_password") || undefined,
            credNotes: get("cred_notes") || undefined,
          }
        : null;

    return { rowNumber, raw, errors, valid };
  });

  return { rows };
}
