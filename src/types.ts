export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  missing: number;
  invalid: number;
  outliers?: number;
}

export interface DataSummary {
  rows: number;
  columns: number;
  columnDetails: DataColumn[];
  duplicates: number;
}

export interface CleaningIssues {
  missingValues: DataColumn[];
  invalidTypes: DataColumn[];
  outliers: DataColumn[];
  duplicates: number;
}

export interface Statistics {
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  stdDev?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type Screen = 'upload' | 'cleaning' | 'visualization' | 'summary';
export type ChartType = 'line' | 'bar' | 'scatter';
