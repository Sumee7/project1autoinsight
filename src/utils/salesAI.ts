// src/utils/salesAI.ts
export type DataRow = Record<string, string | number | null | undefined>;

type ColumnKey =
  | "customer"
  | "product"
  | "category"
  | "date"
  | "revenue"
  | "quantity"
  | "status"
  | "region";

type Intent =
  | "COUNT_NAME"
  | "COUNT_ROWS"
  | "COUNT_DUPLICATES"
  | "LIST_DUPLICATES"
  | "QUALITY_SUMMARY"
  | "WHY_RAW"
  | "TOP_VALUES"
  | "GROUP_SUM"
  | "SUM"
  | "UNKNOWN";

type QueryPlan = {
  intent: Intent;
  nameQuery?: string;              // e.g. "mike"
  column?: string;                 // resolved concrete column name
  metricColumn?: string;           // e.g. Revenue column
  groupByColumn?: string;          // e.g. Category column
  topN?: number;                   // e.g. 5
  filters?: { column: string; op: "eq" | "contains"; value: string }[];
};

type Answer = {
  text: string;
  confidence: "high" | "medium" | "low";
  how: string[]; // explainability bullets
};

function norm(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function stripPunct(s: string) {
  return s.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function toNumberSafe(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const cleaned = s.replace(/[$,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toDateSafe(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function buildHeaderMap(headers: string[]) {
  const map = new Map<string, string>();
  for (const h of headers) map.set(norm(h), h);
  return map;
}

/**
 * Sales-friendly synonyms.
 * You can extend this easily if your dataset uses different headers.
 */
const SYNONYMS: Record<ColumnKey, string[]> = {
  customer: ["customer", "customer name", "client", "client name", "buyer", "name", "customername"],
  product: ["product", "item", "item name", "sku", "product name"],
  category: ["category", "product category", "segment", "type"],
  date: ["date", "order date", "orderdate", "invoice date", "transaction date", "sales date"],
  revenue: ["revenue", "sales", "amount", "total", "total amount", "price", "sale amount"],
  quantity: ["quantity", "qty", "units", "unit sold", "items"],
  status: ["status", "state"],
  region: ["region", "area", "location", "country", "city"],
};

function resolveColumn(headers: string[], key: ColumnKey): string | null {
  const headerMap = buildHeaderMap(headers);
  for (const syn of SYNONYMS[key]) {
    const found = headerMap.get(norm(syn));
    if (found) return found;
  }

  // fallback fuzzy-ish: if header contains synonym token
  const lowerHeaders = headers.map(h => ({ raw: h, n: norm(h) }));
  for (const syn of SYNONYMS[key]) {
    const sn = norm(syn);
    const match = lowerHeaders.find(h => h.n.includes(sn));
    if (match) return match.raw;
  }

  return null;
}

function detectTopN(q: string): number | null {
  const m = q.match(/\btop\s+(\d+)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseNameCount(q: string): string | null {
  // "how many mike", "how many 'mike'", "how many mike are there"
  const m = q.match(/^how many\s+['"]?([a-z]+)['"]?\b/i);
  if (!m) return null;
  const candidate = m[1];
  const blocked = new Set(["rows", "row", "columns", "column", "records", "entries", "duplicates"]);
  if (blocked.has(candidate.toLowerCase())) return null;
  return candidate;
}

function parseFilters(q: string, headers: string[]): { column: string; op: "eq" | "contains"; value: string }[] {
  // very simple filter syntax examples:
  // "where status is paid"
  // "where category = electronics"
  // "where customer contains mike"
  const filters: { column: string; op: "eq" | "contains"; value: string }[] = [];

  const whereIdx = q.toLowerCase().indexOf("where ");
  if (whereIdx === -1) return filters;

  const clause = q.slice(whereIdx + 6).trim();

  // Try to match "<something> contains <value>"
  const containsM = clause.match(/^(.+?)\s+contains\s+(.+)$/i);
  if (containsM) {
    const rawCol = containsM[1].trim();
    const value = stripPunct(containsM[2].trim());
    const col = bestHeaderMatch(headers, rawCol);
    if (col && value) filters.push({ column: col, op: "contains", value });
    return filters;
  }

  // Try to match "<something> is <value>" or "<something> = <value>"
  const eqM = clause.match(/^(.+?)\s+(is|=)\s+(.+)$/i);
  if (eqM) {
    const rawCol = eqM[1].trim();
    const value = stripPunct(eqM[3].trim());
    const col = bestHeaderMatch(headers, rawCol);
    if (col && value) filters.push({ column: col, op: "eq", value });
  }

  return filters;
}

function bestHeaderMatch(headers: string[], raw: string): string | null {
  const r = norm(raw);
  // exact normalized match
  const exact = headers.find(h => norm(h) === r);
  if (exact) return exact;
  // contains match
  const contains = headers.find(h => norm(h).includes(r));
  return contains || null;
}

function applyFilters(rows: DataRow[], filters?: QueryPlan["filters"]): DataRow[] {
  if (!filters || filters.length === 0) return rows;

  return rows.filter(row => {
    for (const f of filters) {
      const cell = stripPunct(String(row[f.column] ?? "")).toLowerCase();
      const target = stripPunct(String(f.value)).toLowerCase();

      if (f.op === "eq" && cell !== target) return false;
      if (f.op === "contains" && !cell.includes(target)) return false;
    }
    return true;
  });
}

function buildRowSignature(row: DataRow, headers: string[]): string {
  // stable row signature for duplicate detection
  return headers.map(h => String(row[h] ?? "").trim()).join("||");
}

function findDuplicateStats(rows: DataRow[], headers: string[]) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const sig = buildRowSignature(r, headers);
    counts.set(sig, (counts.get(sig) ?? 0) + 1);
  }
  const dupSigs = [...counts.entries()].filter(([, c]) => c > 1);
  const duplicateRowCount = dupSigs.reduce((sum, [, c]) => sum + (c - 1), 0);
  return { duplicateRowCount, dupSigs };
}

function dataQualitySummary(rows: DataRow[], headers: string[]) {
  const totalCells = rows.length * headers.length;
  let missing = 0;
  let invalidNumbers = 0;
  let invalidDates = 0;

  // detect likely number/date columns using header synonyms
  const numCandidates = new Set<string>();
  const dateCandidates = new Set<string>();

  const revenueCol = resolveColumn(headers, "revenue");
  const qtyCol = resolveColumn(headers, "quantity");
  const dateCol = resolveColumn(headers, "date");
  if (revenueCol) numCandidates.add(revenueCol);
  if (qtyCol) numCandidates.add(qtyCol);
  if (dateCol) dateCandidates.add(dateCol);

  for (const row of rows) {
    for (const h of headers) {
      const v = row[h];
      const s = String(v ?? "").trim();
      if (v === null || v === undefined || s === "") missing++;

      if (numCandidates.has(h) && s !== "") {
        if (toNumberSafe(v) === null) invalidNumbers++;
      }
      if (dateCandidates.has(h) && s !== "") {
        if (toDateSafe(v) === null) invalidDates++;
      }
    }
  }

  const { duplicateRowCount } = findDuplicateStats(rows, headers);

  const issueCount = missing + invalidNumbers + invalidDates + duplicateRowCount;
  const qualityScore = totalCells === 0 ? 100 : Math.max(0, 100 - (issueCount / totalCells) * 100);

  return {
    totalCells,
    missing,
    invalidNumbers,
    invalidDates,
    duplicateRowCount,
    qualityScore,
  };
}

function countNameInColumn(rows: DataRow[], col: string, name: string): number {
  const target = stripPunct(name).toLowerCase();

  let count = 0;
  for (const r of rows) {
    const cell = stripPunct(String(r[col] ?? "")).toLowerCase();
    if (!cell) continue;

    // token match: counts "mike" in "mike smith"
    const tokens = cell.split(" ");
    if (tokens.includes(target)) count++;
  }
  return count;
}

function topValues(rows: DataRow[], col: string, topN: number): { value: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const r of rows) {
    const v = stripPunct(String(r[col] ?? "")).trim();
    if (!v) continue;
    const key = v.toLowerCase();
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  return [...freq.entries()]
    .map(([k, c]) => ({ value: k, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

function sumColumn(rows: DataRow[], col: string): { sum: number; used: number; skipped: number } {
  let sum = 0;
  let used = 0;
  let skipped = 0;

  for (const r of rows) {
    const n = toNumberSafe(r[col]);
    if (n === null) {
      skipped++;
      continue;
    }
    sum += n;
    used++;
  }

  return { sum, used, skipped };
}

function groupSum(rows: DataRow[], groupCol: string, metricCol: string, topN: number) {
  const agg = new Map<string, number>();
  let skipped = 0;

  for (const r of rows) {
    const g = stripPunct(String(r[groupCol] ?? "")).trim();
    if (!g) continue;

    const n = toNumberSafe(r[metricCol]);
    if (n === null) {
      skipped++;
      continue;
    }

    const key = g.toLowerCase();
    agg.set(key, (agg.get(key) ?? 0) + n);
  }

  return {
    rows: [...agg.entries()]
      .map(([k, v]) => ({ group: k, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN),
    skipped,
  };
}

function parseQuestionToPlan(question: string, headers: string[]): QueryPlan {
  const q = question.trim();

  const lower = q.toLowerCase();
  const filters = parseFilters(q, headers);

  // WHY RAW / dirty data explanations
  if (lower.includes("why") && (lower.includes("raw") || lower.includes("dirty") || lower.includes("unclean"))) {
    return { intent: "WHY_RAW", filters };
  }

  // Quality summary
  if (lower.includes("quality") || lower.includes("dirty") || lower.includes("issues") || lower.includes("problem")) {
    return { intent: "QUALITY_SUMMARY", filters };
  }

  // Duplicates
  if (lower.includes("duplicate")) {
    if (lower.includes("list") || lower.includes("show")) return { intent: "LIST_DUPLICATES", filters };
    return { intent: "COUNT_DUPLICATES", filters };
  }

  // Count rows
  if (lower.includes("how many") && (lower.includes("rows") || lower.includes("records") || lower.includes("entries"))) {
    return { intent: "COUNT_ROWS", filters };
  }

  // Count a name (sales focus: prefer customer column)
  const name = parseNameCount(lower);
  if (name) {
    return { intent: "COUNT_NAME", nameQuery: name, filters };
  }

  // Top values
  const topN = detectTopN(q) ?? 5;
  if (lower.includes("top") && (lower.includes("customer") || lower.includes("product") || lower.includes("category"))) {
    let key: ColumnKey = "customer";
    if (lower.includes("product")) key = "product";
    if (lower.includes("category")) key = "category";
    const col = resolveColumn(headers, key);
    return { intent: "TOP_VALUES", column: col ?? undefined, topN, filters };
  }

  // Group sum: "sales by category" / "revenue by product" / "sales by customer"
  if ((lower.includes("by category") || lower.includes("by product") || lower.includes("by customer")) &&
      (lower.includes("sales") || lower.includes("revenue") || lower.includes("amount") || lower.includes("total"))) {
    const metricCol = resolveColumn(headers, "revenue");
    let groupKey: ColumnKey = "category";
    if (lower.includes("by product")) groupKey = "product";
    if (lower.includes("by customer")) groupKey = "customer";
    const groupByColumn = resolveColumn(headers, groupKey);
    return {
      intent: "GROUP_SUM",
      metricColumn: metricCol ?? undefined,
      groupByColumn: groupByColumn ?? undefined,
      topN,
      filters,
    };
  }

  // Sum: "total revenue" / "total sales"
  if (lower.includes("total") && (lower.includes("revenue") || lower.includes("sales") || lower.includes("amount"))) {
    const metricCol = resolveColumn(headers, "revenue");
    return { intent: "SUM", metricColumn: metricCol ?? undefined, filters };
  }

  return { intent: "UNKNOWN", filters };
}

/**
 * Main function: this is what you call from your UI.
 * You can cache results outside this function if you want.
 */
export function answerSalesQuestion(args: {
  question: string;
  rows: DataRow[];
  headers: string[];
}): Answer {
  const { question, rows, headers } = args;

  if (!rows || rows.length === 0 || !headers || headers.length === 0) {
    return {
      text: "I don’t have any rows to analyze yet. Upload a CSV first.",
      confidence: "low",
      how: [],
    };
  }

  const plan = parseQuestionToPlan(question, headers);
  const filteredRows = applyFilters(rows, plan.filters);

  const how: string[] = [];
  if (plan.filters && plan.filters.length > 0) {
    how.push(`Filters applied: ${plan.filters.map(f => `${f.column} ${f.op} "${f.value}"`).join(", ")}`);
  } else {
    how.push("No filters applied.");
  }
  how.push(`Rows considered: ${filteredRows.length.toLocaleString()} (out of ${rows.length.toLocaleString()})`);

  switch (plan.intent) {
    case "COUNT_ROWS": {
      return {
        text: `You have **${filteredRows.length.toLocaleString()} rows** in this dataset (after any filters).`,
        confidence: "high",
        how,
      };
    }

    case "COUNT_NAME": {
      // Prefer customer column if possible
      const customerCol = resolveColumn(headers, "customer");
      if (!customerCol) {
        return {
          text: `I can count names, but I couldn’t find a “Customer Name” column. Try asking with a column like: "how many mike where Name contains mike".`,
          confidence: "medium",
          how: [...how, "Customer column not found via synonyms."],
        };
      }

      const name = plan.nameQuery!;
      const c = countNameInColumn(filteredRows, customerCol, name);

      return {
        text: `There are **${c}** rows where **${customerCol}** contains the name **"${name}"**.`,
        confidence: "high",
        how: [...how, `Counted token matches in column: ${customerCol}`],
      };
    }

    case "COUNT_DUPLICATES": {
      const { duplicateRowCount } = findDuplicateStats(filteredRows, headers);
      return {
        text: `Found **${duplicateRowCount} duplicate rows** (extra copies beyond the first).`,
        confidence: "high",
        how: [...how, "Duplicates detected by matching entire-row signatures across all columns."],
      };
    }

    case "LIST_DUPLICATES": {
      const { dupSigs } = findDuplicateStats(filteredRows, headers);
      if (dupSigs.length === 0) {
        return {
          text: "✅ No duplicate rows found.",
          confidence: "high",
          how,
        };
      }

      // show a small preview (first 3 duplicate signatures)
      const preview = dupSigs.slice(0, 3).map(([sig, count], idx) => {
        const parts = sig.split("||");
        const show = headers.slice(0, Math.min(4, headers.length)).map((h, i) => `${h}: ${parts[i] ?? ""}`).join(", ");
        return `${idx + 1}) ${show} (appears ${count} times)`;
      }).join("\n");

      return {
        text:
          `Here are example duplicates (showing up to 3 groups):\n` +
          `${preview}\n\nTip: If you want, I can list duplicates based on a specific key like Customer+Date.`,
        confidence: "medium",
        how: [...how, "Preview shows a subset to keep the chat readable."],
      };
    }

    case "QUALITY_SUMMARY": {
      const q = dataQualitySummary(filteredRows, headers);

      const assessment =
        q.qualityScore >= 95 ? "Excellent (very clean)" :
        q.qualityScore >= 85 ? "Good (minor issues)" :
        q.qualityScore >= 70 ? "Fair (needs cleaning)" :
        "Poor (significant issues)";

      return {
        text:
          `📋 **Data Quality Summary**\n` +
          `Quality Score: **${q.qualityScore.toFixed(1)}%** (${assessment})\n\n` +
          `Issues detected:\n` +
          `• Missing cells: ${q.missing}\n` +
          `• Invalid numbers: ${q.invalidNumbers}\n` +
          `• Invalid dates: ${q.invalidDates}\n` +
          `• Duplicate rows: ${q.duplicateRowCount}\n\n` +
          `If you want, ask: “show dirty rows” and I’ll give examples.`,
        confidence: "high",
        how: [...how, "Score is based on issue density across all cells (missing + invalid + duplicates)."],
      };
    }

    case "WHY_RAW": {
      return {
        text:
          `Raw (dirty) data usually means it hasn’t been prepared for analysis. Common reasons:\n` +
          `• Missing values (incomplete records)\n` +
          `• Invalid formats (text where numbers/dates should be)\n` +
          `• Duplicate rows (double-counting sales)\n` +
          `• Inconsistent categories/names (e.g., “Electronics” vs “electronics”)\n\n` +
          `AutoInsight helps by detecting these issues and cleaning them so results are reliable.`,
        confidence: "high",
        how,
      };
    }

    case "TOP_VALUES": {
      if (!plan.column) {
        return {
          text: `I can do “top” lists, but I couldn’t identify which column you meant. Try: “top 5 customers” or “top 5 products”.`,
          confidence: "medium",
          how,
        };
      }

      const topN = plan.topN ?? 5;
      const tops = topValues(filteredRows, plan.column, topN);
      if (tops.length === 0) {
        return { text: `No values found in column "${plan.column}".`, confidence: "medium", how };
      }

      return {
        text:
          `Top ${topN} values in **${plan.column}**:\n` +
          tops.map((t, i) => `${i + 1}. ${t.value} (${t.count})`).join("\n"),
        confidence: "high",
        how: [...how, `Computed frequency counts for column: ${plan.column}`],
      };
    }

    case "SUM": {
      const metric = plan.metricColumn;
      if (!metric) {
        return {
          text: `I can calculate totals, but I couldn’t find a revenue/sales column. Try using the exact column name (e.g., “total Amount”).`,
          confidence: "medium",
          how,
        };
      }

      const { sum, used, skipped } = sumColumn(filteredRows, metric);
      return {
        text:
          `Total **${metric}** = **${sum.toFixed(2)}**\n` +
          `(${used} rows used, ${skipped} skipped due to missing/invalid values)`,
        confidence: "high",
        how: [...how, `Summed numeric values from column: ${metric}`],
      };
    }

    case "GROUP_SUM": {
      const groupCol = plan.groupByColumn;
      const metricCol = plan.metricColumn;
      const topN = plan.topN ?? 5;

      if (!groupCol || !metricCol) {
        return {
          text: `I can do “sales by category/product/customer”, but I couldn’t find the needed columns. Try using the exact column names.`,
          confidence: "medium",
          how: [...how, `groupBy=${groupCol ?? "missing"}, metric=${metricCol ?? "missing"}`],
        };
      }

      const result = groupSum(filteredRows, groupCol, metricCol, topN);
      if (result.rows.length === 0) {
        return { text: `No grouped results found for "${groupCol}".`, confidence: "medium", how };
      }

      return {
        text:
          `Top ${topN} **${groupCol}** by **${metricCol}**:\n` +
          result.rows.map((r, i) => `${i + 1}. ${r.group} — ${r.value.toFixed(2)}`).join("\n") +
          (result.skipped > 0 ? `\n\n(${result.skipped} rows skipped due to invalid/missing ${metricCol})` : ""),
        confidence: "high",
        how: [...how, `Grouped by ${groupCol} and summed ${metricCol}.`],
      };
    }

    default:
      return {
        text:
          `I didn’t fully understand that question yet.\n\nTry one of these:\n` +
          `• “Explain the data quality”\n` +
          `• “How many rows are there?”\n` +
          `• “How many Mike are there?”\n` +
          `• “How many duplicates?”\n` +
          `• “Total revenue”\n` +
          `• “Sales by category”\n` +
          `• “Top 5 customers”`,
        confidence: "low",
        how,
      };
  }
}
