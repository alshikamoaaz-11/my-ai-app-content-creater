/**
 * Reader for the exported anb tweet workbook.
 *
 * The canonical export (extracted_tweets_2025_2026.xlsx) has the header:
 *   Tweet ID | Date & Time | Tweet Text | Favorites | Source
 *
 * Only `Favorites` (likes) is present as an engagement metric; retweets,
 * replies and impressions are not in the export and default to 0 so they can
 * be backfilled from another source later.
 */
import ExcelJS from "exceljs";

export type RawTweet = {
  id: string;
  text: string;
  created_at: string | null;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  source: string | null;
};

/** Flatten any ExcelJS cell value (rich text, hyperlink, formula…) to a string. */
function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const v = value as unknown as Record<string, unknown>;
    if (typeof v.text === "string") return v.text;
    if (Array.isArray(v.richText)) {
      return (v.richText as Array<{ text?: string }>).map((r) => r.text ?? "").join("");
    }
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
  }
  return String(value);
}

function toInt(value: ExcelJS.CellValue): number {
  const n = parseInt(cellText(value).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Parse "2026-03-20 10:00:48" (assumed UTC) to an ISO string, or null. */
function toIso(value: ExcelJS.CellValue): string | null {
  if (value instanceof Date) return value.toISOString();
  const raw = cellText(value).trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const withZone = /[zZ]|[+-]\d\d:?\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Match header cells loosely so minor export-header changes still map. */
function buildColumnMap(headerRow: ExcelJS.Row): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.eachCell((cell, col) => {
    const h = cellText(cell.value).toLowerCase().trim();
    if (/\bid\b/.test(h)) map.id = col;
    else if (h.includes("text") || h.includes("tweet")) map.text ??= col;
    else if (h.includes("date") || h.includes("time")) map.created_at = col;
    else if (h.includes("favorite") || h.includes("like")) map.likes = col;
    else if (h.includes("retweet") || h.includes("repost")) map.retweets = col;
    else if (h.includes("repl")) map.replies = col;
    else if (h.includes("impression") || h.includes("view")) map.impressions = col;
    else if (h.includes("source")) map.source = col;
  });
  return map;
}

export async function readTweetsFromXlsx(path: string): Promise<RawTweet[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error(`No worksheet found in ${path}`);

  const cols = buildColumnMap(ws.getRow(1));
  for (const required of ["id", "text"] as const) {
    if (!cols[required]) {
      throw new Error(
        `Could not locate a "${required}" column in ${path}. Headers: ` +
          `${cellText(ws.getRow(1).values as unknown as ExcelJS.CellValue)}`
      );
    }
  }

  const rows: RawTweet[] = [];
  const seen = new Set<string>();

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cell = (c?: number) => (c ? row.getCell(c).value : null);

    const id = cellText(cell(cols.id)).trim();
    const text = cellText(cell(cols.text)).trim();
    if (!id || !text) continue; // skip blank / malformed rows
    if (seen.has(id)) continue; // de-dupe on Tweet ID
    seen.add(id);

    rows.push({
      id,
      text,
      created_at: toIso(cell(cols.created_at)),
      likes: toInt(cell(cols.likes)),
      retweets: toInt(cell(cols.retweets)),
      replies: toInt(cell(cols.replies)),
      impressions: toInt(cell(cols.impressions)),
      source: cellText(cell(cols.source)).trim() || null,
    });
  }

  return rows;
}
