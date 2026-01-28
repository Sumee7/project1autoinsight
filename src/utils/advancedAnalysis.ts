// Advanced AI Data Analysis Engine
import { DataSummary } from '../types';

export type DataRow = Record<string, string | number | null | undefined>;

interface ColumnStats {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  uniqueCount: number;
  uniqueValues: string[];
  nullCount: number;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  mode?: string | number;
  mostCommon: Array<[string | number, number]>;
}

interface CorrelationResult {
  column1: string;
  column2: string;
  correlation: number;
  strength: 'very strong' | 'strong' | 'moderate' | 'weak' | 'very weak';
}

interface AnomalyInfo {
  columnName: string;
  anomalies: Array<{
    rowIndex: number;
    value: any;
    type: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Generate comprehensive column statistics
 */
export function analyzeColumnStats(rows: DataRow[], columnName: string): ColumnStats | null {
  if (!rows || rows.length === 0) return null;

  const values = rows.map(row => row[columnName]);
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNull.length === 0) {
    return {
      name: columnName,
      type: 'string',
      uniqueCount: 0,
      uniqueValues: [],
      nullCount: values.length,
      mostCommon: [],
    };
  }

  const uniqueSet = new Set(nonNull.map(String));
  const uniqueValues = Array.from(uniqueSet);

  // Frequency analysis
  const frequency = new Map<string, number>();
  for (const v of nonNull) {
    const key = String(v).toLowerCase();
    frequency.set(key, (frequency.get(key) ?? 0) + 1);
  }
  const mostCommon = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Numeric analysis
  const numericValues = nonNull
    .map(v => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  let stats: ColumnStats = {
    name: columnName,
    type: numericValues.length > nonNull.length * 0.8 ? 'number' : 'string',
    uniqueCount: uniqueValues.length,
    uniqueValues: uniqueValues.slice(0, 20),
    nullCount: values.length - nonNull.length,
    mostCommon: mostCommon as Array<[string | number, number]>,
  };

  if (numericValues.length > 0) {
    const sorted = [...numericValues].sort((a, b) => a - b);
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / numericValues.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = numericValues.reduce((sq, n) => sq + (n - mean) ** 2, 0) / numericValues.length;

    stats = {
      ...stats,
      type: 'number',
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      mean,
      median,
      stdDev: Math.sqrt(variance),
      mode: mostCommon[0]?.[0],
    };
  } else {
    // String length analysis
    const lengths = nonNull.map(v => String(v).length);
    stats.minLength = Math.min(...lengths);
    stats.maxLength = Math.max(...lengths);
  }

  return stats;
}

/**
 * Find patterns and trends in data
 */
export function detectPatterns(rows: DataRow[], columnName: string): string[] {
  const stats = analyzeColumnStats(rows, columnName);
  if (!stats) return [];

  const patterns: string[] = [];

  // Check for date-like patterns
  if (stats.uniqueCount > 10 && stats.uniqueValues.some(v => /\d{4}[-\/]\d{2}[-\/]\d{2}/.test(String(v)))) {
    patterns.push('Date/temporal data');
  }

  // Check for email patterns
  if (stats.uniqueValues.some(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))) {
    patterns.push('Email addresses');
  }

  // Check for URL patterns
  if (stats.uniqueValues.some(v => /^https?:\/\//.test(String(v)))) {
    patterns.push('URLs/web links');
  }

  // Check for phone patterns
  if (stats.uniqueValues.some(v => /^\+?[\d\s\-()]{10,}$/.test(String(v)))) {
    patterns.push('Phone numbers');
  }

  // Check for categorical data
  if (stats.uniqueCount <= rows.length * 0.1 && stats.type === 'string') {
    patterns.push('Categorical data (limited unique values)');
  }

  // Check for ID-like patterns
  if (stats.uniqueCount === rows.length && /^[a-zA-Z0-9_-]+$/.test(String(stats.uniqueValues[0]))) {
    patterns.push('Identifier/ID column');
  }

  // Numeric patterns
  if (stats.type === 'number' && stats.stdDev !== undefined) {
    if (stats.stdDev === 0) {
      patterns.push('Constant values (no variation)');
    } else if (stats.stdDev > (stats.max! - stats.min!) * 0.5) {
      patterns.push('High variability');
    } else {
      patterns.push('Consistent distribution');
    }
  }

  return patterns;
}

/**
 * Detect anomalies and outliers
 */
export function detectAnomalies(rows: DataRow[], columnName: string, threshold = 1.5): AnomalyInfo {
  const stats = analyzeColumnStats(rows, columnName);
  if (!stats) {
    return { columnName, anomalies: [] };
  }

  const anomalies: AnomalyInfo['anomalies'] = [];

  if (stats.type === 'number' && stats.stdDev !== undefined && stats.mean !== undefined) {
    // IQR method for outliers
    const numericValues = rows
      .map((row, idx) => {
        const v = row[columnName];
        const n = Number(v);
        return { value: n, index: idx };
      })
      .filter(x => Number.isFinite(x.value));

    const sorted = [...numericValues].sort((a, b) => a.value - b.value);
    const q1 = sorted[Math.floor(sorted.length * 0.25)].value;
    const q3 = sorted[Math.floor(sorted.length * 0.75)].value;
    const iqr = q3 - q1;
    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;

    for (const { value, index } of numericValues) {
      if (value < lowerBound || value > upperBound) {
        anomalies.push({
          rowIndex: index,
          value,
          type: 'outlier',
          severity: Math.abs(value - stats.mean) > 3 * stats.stdDev ? 'high' : 'medium',
        });
      }
    }
  } else if (stats.type === 'string') {
    // Detect unusual string values
    const avgLength = stats.uniqueValues.reduce((sum, v) => sum + String(v).length, 0) / stats.uniqueValues.length;

    for (let i = 0; i < rows.length; i++) {
      const v = String(rows[i][columnName] ?? '');
      if (v.length > avgLength * 2.5 || v.length < avgLength * 0.1) {
        anomalies.push({
          rowIndex: i,
          value: v,
          type: 'unusual_length',
          severity: 'low',
        });
      }
    }
  }

  return { columnName, anomalies };
}

/**
 * Calculate correlations between numeric columns
 */
export function calculateCorrelations(rows: DataRow[], columnNames: string[]): CorrelationResult[] {
  const numericCols = columnNames.filter(col => {
    const sample = rows[0]?.[col];
    return sample !== null && !Number.isNaN(Number(sample));
  });

  const correlations: CorrelationResult[] = [];

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const col1 = numericCols[i];
      const col2 = numericCols[j];

      const values1 = rows.map(r => Number(r[col1])).filter(Number.isFinite);
      const values2 = rows.map(r => Number(r[col2])).filter(Number.isFinite);

      if (values1.length < 2 || values2.length < 2) continue;

      const mean1 = values1.reduce((a, b) => a + b) / values1.length;
      const mean2 = values2.reduce((a, b) => a + b) / values2.length;

      let covariance = 0;
      let variance1 = 0;
      let variance2 = 0;

      for (let k = 0; k < Math.min(values1.length, values2.length); k++) {
        const diff1 = values1[k] - mean1;
        const diff2 = values2[k] - mean2;
        covariance += diff1 * diff2;
        variance1 += diff1 * diff1;
        variance2 += diff2 * diff2;
      }

      const correlation = covariance / Math.sqrt(variance1 * variance2);
      const absCorr = Math.abs(correlation);

      let strength: CorrelationResult['strength'] = 'very weak';
      if (absCorr > 0.9) strength = 'very strong';
      else if (absCorr > 0.7) strength = 'strong';
      else if (absCorr > 0.5) strength = 'moderate';
      else if (absCorr > 0.3) strength = 'weak';

      correlations.push({ column1: col1, column2: col2, correlation, strength });
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

/**
 * Generate intelligent data insights
 */
export function generateInsights(rows: DataRow[], columns: string[]): string[] {
  const insights: string[] = [];

  if (rows.length === 0) return insights;

  // Data size insight
  insights.push(`📊 Dataset contains ${rows.length.toLocaleString()} rows and ${columns.length} columns`);

  // Completeness
  let totalCells = 0;
  let nullCells = 0;
  for (const row of rows) {
    for (const col of columns) {
      totalCells++;
      if (row[col] === null || row[col] === undefined || row[col] === '') nullCells++;
    }
  }
  const completeness = ((totalCells - nullCells) / totalCells * 100).toFixed(1);
  insights.push(`✅ Data completeness: ${completeness}%`);

  // Duplicates
  const signatures = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const sig = columns.map(c => row[c]).join('||');
    if (signatures.has(sig)) duplicates++;
    else signatures.add(sig);
  }
  if (duplicates > 0) {
    insights.push(`⚠️ Found ${duplicates} duplicate rows`);
  }

  // Column diversity
  const diverseColumns = [];
  for (const col of columns) {
    const unique = new Set(rows.map(r => r[col])).size;
    if (unique > rows.length * 0.8) {
      diverseColumns.push(col);
    }
  }
  if (diverseColumns.length > 0) {
    insights.push(`🔀 High-diversity columns: ${diverseColumns.slice(0, 3).join(', ')}`);
  }

  // Correlations
  const correlations = calculateCorrelations(rows, columns);
  const strongCorr = correlations.filter(c => Math.abs(c.correlation) > 0.7);
  if (strongCorr.length > 0) {
    const top = strongCorr[0];
    insights.push(`🔗 Strong correlation: ${top.column1} ↔ ${top.column2} (${top.correlation.toFixed(2)})`);
  }

  return insights;
}

/**
 * Answer complex questions about data
 */
export function answerComplexQuestion(question: string, rows: DataRow[], columns: string[], dataSummary?: DataSummary): string {
  const q = question.toLowerCase();

  // Distribution analysis
  if (q.includes('distribution') || q.includes('spread')) {
    const numCols = columns.filter(col => {
      const sample = rows[0]?.[col];
      return sample !== null && !Number.isNaN(Number(sample));
    });

    if (numCols.length === 0) {
      return 'No numeric columns found for distribution analysis.';
    }

    let response = '📈 **Distribution Analysis:**\n\n';
    for (const col of numCols.slice(0, 3)) {
      const stats = analyzeColumnStats(rows, col);
      if (stats && stats.mean !== undefined && stats.stdDev !== undefined) {
        response += `**${col}**: Mean = ${stats.mean.toFixed(2)}, StdDev = ${stats.stdDev.toFixed(2)}, Range = [${stats.min}, ${stats.max}]\n`;
      }
    }
    return response;
  }

  // Correlation analysis
  if (q.includes('correlation') || q.includes('relate')) {
    const correlations = calculateCorrelations(rows, columns).slice(0, 5);
    if (correlations.length === 0) {
      return 'No significant correlations found between numeric columns.';
    }

    let response = '🔗 **Correlation Analysis:**\n\n';
    for (const corr of correlations) {
      const strength = corr.correlation > 0 ? '↑' : '↓';
      response += `${corr.column1} ${strength} ${corr.column2}: ${corr.correlation.toFixed(3)} (${corr.strength})\n`;
    }
    return response;
  }

  // Pattern detection
  if (q.includes('pattern') || q.includes('trend')) {
    let response = '🔍 **Detected Patterns:**\n\n';
    for (const col of columns.slice(0, 4)) {
      const patterns = detectPatterns(rows, col);
      if (patterns.length > 0) {
        response += `**${col}**: ${patterns.join(', ')}\n`;
      }
    }
    return response.trim() || 'No specific patterns detected.';
  }

  // Anomaly detection
  if (q.includes('anomal') || q.includes('outlier') || q.includes('unusual')) {
    let response = '⚠️ **Anomaly Detection:**\n\n';
    for (const col of columns.slice(0, 3)) {
      const anomalies = detectAnomalies(rows, col);
      if (anomalies.anomalies.length > 0) {
        response += `**${col}**: ${anomalies.anomalies.length} anomalies detected\n`;
      }
    }
    return response.trim() || 'No major anomalies detected - data looks clean!';
  }

  // Data quality summary
  if (q.includes('quality') || q.includes('clean')) {
    let totalNull = 0;
    for (const row of rows) {
      for (const col of columns) {
        if (row[col] === null || row[col] === undefined || row[col] === '') totalNull++;
      }
    }
    const completeness = ((1 - totalNull / (rows.length * columns.length)) * 100).toFixed(1);

    let response = `📋 **Data Quality Report:**\n\n`;
    response += `Completeness: ${completeness}%\n`;
    response += `Total Rows: ${rows.length.toLocaleString()}\n`;
    response += `Total Columns: ${columns.length}\n`;

    const unique = new Set(rows.map(r => columns.map(c => r[c]).join('||'))).size;
    response += `Unique Records: ${unique.toLocaleString()}\n`;

    const duplicates = rows.length - unique;
    if (duplicates > 0) {
      response += `Duplicates: ${duplicates}\n`;
    }

    return response;
  }

  return '';
}

/**
 * Smart question classification
 */
export function classifyQuestion(question: string): {
  type: 'distribution' | 'correlation' | 'pattern' | 'anomaly' | 'quality' | 'general';
  confidence: number;
} {
  const q = question.toLowerCase();

  if (q.includes('distribution') || q.includes('spread') || q.includes('histogram')) {
    return { type: 'distribution', confidence: 0.95 };
  }
  if (q.includes('correlation') || q.includes('relate') || q.includes('connection')) {
    return { type: 'correlation', confidence: 0.9 };
  }
  if (q.includes('pattern') || q.includes('trend') || q.includes('behavior')) {
    return { type: 'pattern', confidence: 0.85 };
  }
  if (q.includes('anomal') || q.includes('outlier') || q.includes('unusual')) {
    return { type: 'anomaly', confidence: 0.9 };
  }
  if (q.includes('quality') || q.includes('clean') || q.includes('issue')) {
    return { type: 'quality', confidence: 0.85 };
  }

  return { type: 'general', confidence: 0.5 };
}
