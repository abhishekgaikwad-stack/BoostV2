"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { createBulkListings } from "@/app/(dashboard)/sell/bulk-actions";
import {
  buildTemplateCsv,
  type ParsedBulkRow,
  parseBulkCsv,
} from "@/lib/csv";
import { cn } from "@/lib/utils";
import type { Game } from "@/types";

const PREVIEW_LIMIT = 30;

type Result =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; ids: string[] };

export function BulkListingUpload({ games }: { games: Game[] }) {
  const router = useRouter();
  const [gameId, setGameId] = useState<string>(games[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedBulkRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedGame = useMemo(
    () => games.find((g) => g.id === gameId) ?? null,
    [games, gameId],
  );

  const validCount = parsed.filter((p) => p.valid).length;
  const errorCount = parsed.length - validCount;
  const canSubmit =
    parsed.length > 0 && errorCount === 0 && !pending && selectedGame !== null;

  function reset() {
    setParsed([]);
    setFileError(null);
    setFileName(null);
    setResult({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleGameChange(next: string) {
    setGameId(next);
    reset();
  }

  function downloadTemplate() {
    if (!selectedGame) return;
    const csv = buildTemplateCsv(selectedGame.slug);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `listings-${selectedGame.slug}-template.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    setFileError(null);
    setResult({ kind: "idle" });
    if (!selectedGame) {
      setFileError("Pick a game first.");
      return;
    }
    setFileName(file.name);
    try {
      const text = await file.text();
      const outcome = parseBulkCsv(text, selectedGame.slug);
      if (outcome.fileError) {
        setFileError(outcome.fileError);
        setParsed([]);
        return;
      }
      setParsed(outcome.rows);
    } catch {
      setFileError("Could not read the file.");
      setParsed([]);
    }
  }

  function handleSubmit() {
    if (!selectedGame) return;
    const validRows = parsed.filter((p) => p.valid).map((p) => p.valid!);
    if (validRows.length === 0) return;
    startTransition(async () => {
      const response = await createBulkListings(
        selectedGame.id,
        selectedGame.slug,
        validRows,
      );
      if (!response.ok) {
        setResult({ kind: "error", message: response.error });
        return;
      }
      setResult({ kind: "success", ids: response.createdIds });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-[32px] border border-brand-border-light bg-white p-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[16px] font-medium text-brand-text-primary-light">
            Step 1 · Pick a game
          </h2>
          <p className="font-display text-[12px] leading-4 text-brand-text-secondary-light">
            Every row in your CSV must belong to the same game. The template
            prefills the slug for you.
          </p>
        </div>
        <div className="relative max-w-[320px]">
          <select
            value={gameId}
            onChange={(e) => handleGameChange(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl bg-brand-bg-pill px-4 pr-10 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none"
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary-dark"
            strokeWidth={1.5}
          />
        </div>

        <button
          type="button"
          onClick={downloadTemplate}
          disabled={!selectedGame}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-brand-bg-light px-4 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-pill disabled:opacity-60"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Download template CSV
        </button>
      </section>

      <section className="flex flex-col gap-4 rounded-[32px] border border-brand-border-light bg-white p-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[16px] font-medium text-brand-text-primary-light">
            Step 2 · Upload filled CSV
          </h2>
          <p className="font-display text-[12px] leading-4 text-brand-text-secondary-light">
            Up to 500 rows. Screenshots aren't part of bulk — add them per
            listing from the edit page.
          </p>
        </div>
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-border-light bg-brand-bg-light px-6 py-8 text-center transition hover:border-brand-text-secondary-light">
          <FileUp
            className="h-6 w-6 text-brand-text-secondary-light"
            strokeWidth={1.5}
          />
          <span className="font-display text-[14px] font-medium text-brand-text-primary-light">
            {fileName ? fileName : "Click or drop a CSV here"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        {fileError ? (
          <p className="font-display text-[12px] font-medium text-brand-discount">
            {fileError}
          </p>
        ) : null}
      </section>

      {parsed.length > 0 ? (
        <section className="flex flex-col gap-4 rounded-[32px] border border-brand-border-light bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[16px] font-medium text-brand-text-primary-light">
              Step 3 · Review
            </h2>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-success/15 px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-brand-success">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                {validCount} valid
              </span>
              {errorCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-discount/15 px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-brand-discount">
                  <AlertCircle className="h-3 w-3" strokeWidth={2} />
                  {errorCount} error{errorCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-2xl border border-brand-border-light">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-brand-bg-light font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-light">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">MRP</th>
                  <th className="px-3 py-2">Credentials</th>
                  <th className="px-3 py-2">Issues</th>
                </tr>
              </thead>
              <tbody className="font-display text-[12px] text-brand-text-primary-light">
                {parsed.slice(0, PREVIEW_LIMIT).map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={cn(
                      "border-t border-brand-border-light",
                      row.errors.length > 0 && "bg-brand-discount/5",
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-brand-text-secondary-light">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2">
                      {row.errors.length === 0 ? (
                        <CheckCircle2
                          className="h-4 w-4 text-brand-success"
                          strokeWidth={2}
                        />
                      ) : (
                        <AlertCircle
                          className="h-4 w-4 text-brand-discount"
                          strokeWidth={2}
                        />
                      )}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2">
                      {row.raw.title || (
                        <span className="text-brand-text-tertiary-dark">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {row.raw.price_eur || (
                        <span className="text-brand-text-tertiary-dark">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {row.raw.old_price_eur || (
                        <span className="text-brand-text-tertiary-dark">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-brand-text-secondary-light">
                      {row.raw.cred_login || row.raw.cred_password
                        ? "Included"
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-brand-discount">
                      {row.errors.join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > PREVIEW_LIMIT ? (
              <div className="border-t border-brand-border-light bg-brand-bg-light px-3 py-2 text-center font-display text-[11px] text-brand-text-secondary-light">
                Showing {PREVIEW_LIMIT} of {parsed.length} rows. All will be
                validated and created.
              </div>
            ) : null}
          </div>

          {result.kind === "error" ? (
            <p className="font-display text-[12px] font-medium text-brand-discount">
              {result.message}
            </p>
          ) : null}

          {result.kind === "success" ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-brand-success/30 bg-brand-success/10 p-4">
              <p className="font-display text-[13px] font-medium text-brand-success">
                Created {result.ids.length} listing
                {result.ids.length === 1 ? "" : "s"}.
              </p>
              <Link
                href="/user/currently-selling"
                className="font-display text-[12px] font-medium text-brand-text-primary-light underline underline-offset-2"
              >
                Manage listings →
              </Link>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="inline-flex h-12 items-center rounded-2xl border border-brand-border-light bg-white px-5 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light disabled:opacity-60"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex h-12 items-center rounded-xl bg-black px-5 font-display text-[14px] font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {pending
                ? "Creating…"
                : `Create ${validCount} listing${validCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
