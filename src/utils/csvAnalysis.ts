// src/utils/csvAnalysis.ts
import type { CleaningIssues, DataSummary } from "../types";

type ColumnType = "number" | "date" | "string";

type MissingValueIssue = {
  name: string;
  type: ColumnType;
  missing: number;
};

type InvalidTypeIssue = {
  name: string;
  type: ColumnType;
  invalid: number;
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}

// Simple CSV parser (handles quoted commas, basic cases)
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        // double quote inside quotes -> escaped quote
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
        continue;
      }

      cur += ch;
    }

    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((l) =>
    parseLine(l).map((v) => v.replace(/^"|"$/g, "").trim())
  );

  return { headers, rows };
}

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "nan" || s.toLowerCase() === "none";
}

function tryParseNumber(v: unknown): { ok: boolean; value: number | null } {
  if (isEmpty(v)) return { ok: true, value: null };

  // replaceAll yok -> regex ile
  const raw = String(v).trim().replace(/,/g, "");
  const n = Number(raw);
  if (!Number.isFinite(n)) return { ok: false, value: null };
  return { ok: true, value: n };
}

function tryParseDate(v: unknown): { ok: boolean; value: string | null } {
  if (isEmpty(v)) return { ok: true, value: null };

  const s = String(v).trim();

  // If already ISO-ish, Date can still parse it
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return { ok: false, value: null };

  // Return ISO date (YYYY-MM-DD)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return { ok: true, value: `${yyyy}-${mm}-${dd}` };
}

function inferType(values: unknown[]): ColumnType {
  // use first N non-empty values
  const sample = values.filter((v) => !isEmpty(v)).slice(0, 40);

  if (sample.length === 0) return "string";

  let numOk = 0;
  let dateOk = 0;

  for (const v of sample) {
    if (tryParseNumber(v).ok) numOk++;
    if (tryParseDate(v).ok) dateOk++;
  }

  const numRatio = numOk / sample.length;
  const dateRatio = dateOk / sample.length;

  // prioritize number when mostly numeric
  if (numRatio >= 0.85) return "number";

  // date if mostly date-like and not numeric
  if (dateRatio >= 0.85 && numRatio < 0.5) return "date";

  return "string";
}

function countMissing(values: unknown[]): number {
  let c = 0;
  for (const v of values) if (isEmpty(v)) c++;
  return c;
}

function countInvalid(values: unknown[], expected: ColumnType): number {
  let invalid = 0;

  for (const v of values) {
    if (isEmpty(v)) continue;

    if (expected === "number") {
      if (!tryParseNumber(v).ok) invalid++;
    } else if (expected === "date") {
      if (!tryParseDate(v).ok) invalid++;
    } else {
      // string always ok
    }
  }

  return invalid;
}

function estimateDuplicates(objects: Record<string, unknown>[]): number {
  // naive: hash by JSON string
  const seen = new Set<string>();
  let dup = 0;

  for (const o of objects) {
    const key = JSON.stringify(o);
    if (seen.has(key)) dup++;
    else seen.add(key);
  }
  return dup;
}

export async function analyzeCsvFile(file: File): Promise<{
  dataSummary: DataSummary;
  cleaningIssues: CleaningIssues;
  rows: Record<string, unknown>[];
}> {
  const text = await readFileAsText(file);
  const { headers, rows } = parseCsv(text);

  const objects: Record<string, unknown>[] = rows.map((r) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = r[i] ?? "";
    }
    return obj;
  });

  // Column details
  const columnDetailsRaw = headers.map((name) => {
    const vals = objects.map((o) => o[name]);
    const type = inferType(vals);
    return { name, type };
  });

  // duplicates
  const duplicates = estimateDuplicates(objects);

  // IMPORTANT:
  // Senin projede DataSummary.columnDetails tipi bazen daha "zengin" olabilir.
  // Bu yüzden güvenli cast yapıyorum ki TS hata vermesin.
  const dataSummary: DataSummary = {
    rows: objects.length,
    columns: headers.length,
    duplicates,
    columnDetails: columnDetailsRaw as unknown as DataSummary["columnDetails"],
  };

  // Cleaning issues
  const missingValues: MissingValueIssue[] = headers
    .map((name) => {
      const vals = objects.map((o) => o[name]);
      const missing = countMissing(vals);
      const type = (columnDetailsRaw.find((c) => c.name === name)?.type ?? "string") as ColumnType;
      return { name, type, missing };
    })
    .filter((c) => c.missing > 0);

  const invalidTypes: InvalidTypeIssue[] = headers
    .map((name) => {
      const expected = (columnDetailsRaw.find((c) => c.name === name)?.type ?? "string") as ColumnType;
      const vals = objects.map((o) => o[name]);
      const invalid = countInvalid(vals, expected);
      return { name, type: expected, invalid };
    })
    .filter((c) => c.invalid > 0);

  const cleaningIssues: CleaningIssues = {
    missingValues: missingValues as unknown as CleaningIssues["missingValues"],
    invalidTypes: invalidTypes as unknown as CleaningIssues["invalidTypes"],
    outliers: [], // şimdilik boş, istersen ekleriz
    duplicates,
  };

  return { dataSummary, cleaningIssues, rows: objects };
}
