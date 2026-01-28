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

export type DataRow = Record<string, string | number | null | undefined>;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type Screen = 'login' | 'upload' | 'cleaning' | 'visualization' | 'summary';
export type ChartType = 'line' | 'bar' | 'scatter';

// Collaboration Features
export interface Comment {
  id: string;
  author: string;
  text: string;
  attachedTo: 'insight' | 'chart' | 'row' | 'analysis';
  timestamp: Date;
  resolved: boolean;
}

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
  lastRun: Date;
  tags: string[];
}

export interface SharedAnalysis {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  data: DataRow[];
  insights: string[];
  queries: SavedQuery[];
  comments: Comment[];
  isPublic: boolean;
  shareLink: string;
}

export interface AnalysisTemplate {
  id: string;
  name: string;
  category: 'ecommerce' | 'saas' | 'healthcare' | 'general';
  description: string;
  recommendedCharts: string[];
  suggestedMetrics: string[];
  sampleQueries: SavedQuery[];
}

export interface DataLineageSnapshot {
  timestamp: Date;
  rowCount: number;
  columnCount: number;
  description: string;
  dataHash: string;
}

export interface StatisticalTest {
  name: string;
  testType: 'ttest' | 'chisquare' | 'correlation' | 'anova';
  pValue: number;
  statistic: number;
  significant: boolean;
  interpretation: string;
  confidence: number;
}
