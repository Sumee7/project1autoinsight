/**
 * Drill-Down Analysis Utilities
 * Enables deep analysis and segment comparison
 */

import type { DataRow } from '../types';

export interface DrillDownContext {
  column: string;
  value: string | number;
  filteredData: DataRow[];
  filterCount: number;
  comparisonData?: DataRow[];
}

export interface SegmentComparison {
  segment1: {
    name: string;
    rowCount: number;
    mean?: number;
    median?: number;
    stdev?: number;
    min?: number;
    max?: number;
  };
  segment2: {
    name: string;
    rowCount: number;
    mean?: number;
    median?: number;
    stdev?: number;
    min?: number;
    max?: number;
  };
  differences: {
    rowCountDiff: number;
    rowCountDiffPercent: number;
    meanDiff?: number;
    meanDiffPercent?: number;
    medianDiff?: number;
    stdevDiff?: number;
  };
  isDifferentSignificant: boolean;
}

export interface AnomalyDrill {
  anomalyIndex: number;
  rowData: DataRow;
  anomalyColumn: string;
  anomalyValue: number;
  expectedRange: { min: number; max: number };
  deviationFromMean: number;
  zScore: number;
  similarRows: DataRow[];
}

/**
 * Drill down into a specific value in a column
 */
export function drillDownByValue(
  data: DataRow[],
  column: string,
  value: string | number
): DrillDownContext {
  const filteredData = data.filter((row) => row[column] === value);
  const filterCount = filteredData.length;

  return {
    column,
    value,
    filteredData,
    filterCount,
  };
}

/**
 * Compare two segments side-by-side
 */
export function compareSegments(
  data: DataRow[],
  column: string,
  value1: string | number,
  value2: string | number,
  analyzeColumn?: string
): SegmentComparison {
  const segment1Data = data.filter((row) => row[column] === value1);
  const segment2Data = data.filter((row) => row[column] === value2);

  // Calculate stats for each segment
  const segment1Stats = analyzeColumn
    ? calculateSegmentStats(segment1Data, analyzeColumn)
    : { rowCount: segment1Data.length };

  const segment2Stats = analyzeColumn
    ? calculateSegmentStats(segment2Data, analyzeColumn)
    : { rowCount: segment2Data.length };

  const rowCountDiff = segment1Stats.rowCount - segment2Stats.rowCount;
  const rowCountDiffPercent =
    (rowCountDiff / segment2Stats.rowCount) * 100;

  const isDifferentSignificant = Math.abs(rowCountDiffPercent) > 10;

  const meanDiff = segment1Stats.mean && segment2Stats.mean
    ? Math.round((segment1Stats.mean - segment2Stats.mean) * 100) / 100
    : undefined;
  const meanDiffPercent = segment1Stats.mean && segment2Stats.mean && segment2Stats.mean !== 0
    ? Math.round(((segment1Stats.mean - segment2Stats.mean) / segment2Stats.mean) * 100 * 100) / 100
    : undefined;

  return {
    segment1: {
      name: String(value1),
      rowCount: segment1Stats.rowCount,
      mean: segment1Stats.mean,
      median: segment1Stats.median,
      stdev: segment1Stats.stdev,
      min: segment1Stats.min,
      max: segment1Stats.max,
    },
    segment2: {
      name: String(value2),
      rowCount: segment2Stats.rowCount,
      mean: segment2Stats.mean,
      median: segment2Stats.median,
      stdev: segment2Stats.stdev,
      min: segment2Stats.min,
      max: segment2Stats.max,
    },
    differences: {
      rowCountDiff,
      rowCountDiffPercent: Math.round(rowCountDiffPercent * 100) / 100,
      meanDiff,
      meanDiffPercent,
      medianDiff: segment1Stats.median && segment2Stats.median
        ? Math.round((segment1Stats.median - segment2Stats.median) * 100) / 100
        : undefined,
      stdevDiff: segment1Stats.stdev && segment2Stats.stdev
        ? Math.round((segment1Stats.stdev - segment2Stats.stdev) * 100) / 100
        : undefined,
    },
    isDifferentSignificant,
  };
}

/**
 * Drill down on time series data - focus on specific period
 */
export function timeSeriesDrill(
  data: DataRow[],
  dateColumn: string,
  startDate: Date,
  endDate: Date
): {
  filteredData: DataRow[];
  rowCount: number;
  startDate: Date;
  endDate: Date;
  daysInPeriod: number;
  avgPerDay: number;
} {
  const filteredData = data.filter((row) => {
    const rowDate = new Date(String(row[dateColumn]));
    return rowDate >= startDate && rowDate <= endDate;
  });

  const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  return {
    filteredData,
    rowCount: filteredData.length,
    startDate,
    endDate,
    daysInPeriod: Math.round(daysInPeriod),
    avgPerDay: Math.round((filteredData.length / daysInPeriod) * 100) / 100,
  };
}

/**
 * Drill down on anomaly - understand context
 */
export function anomalyDrill(
  data: DataRow[],
  column: string,
  anomalyRowIndex: number
): AnomalyDrill {
  const numericData = data
    .map((row) => row[column])
    .filter((val) => typeof val === 'number') as number[];

  if (numericData.length === 0) {
    return {
      anomalyIndex: anomalyRowIndex,
      rowData: data[anomalyRowIndex] || {},
      anomalyColumn: column,
      anomalyValue: 0,
      expectedRange: { min: 0, max: 0 },
      deviationFromMean: 0,
      zScore: 0,
      similarRows: [],
    };
  }

  const mean = numericData.reduce((a, b) => a + b, 0) / numericData.length;
  const stdev = Math.sqrt(
    numericData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericData.length
  );

  const anomalyValue = (data[anomalyRowIndex]?.[column] as number) || 0;
  const zScore = (anomalyValue - mean) / stdev;
  const deviationFromMean = anomalyValue - mean;

  const expectedRange = {
    min: mean - 2 * stdev,
    max: mean + 2 * stdev,
  };

  // Find similar rows (within ±1 stdev)
  const similarRows = data.filter((row) => {
    const val = row[column] as number;
    return val >= mean - stdev && val <= mean + stdev;
  });

  return {
    anomalyIndex: anomalyRowIndex,
    rowData: data[anomalyRowIndex] || {},
    anomalyColumn: column,
    anomalyValue,
    expectedRange: {
      min: Math.round(expectedRange.min * 100) / 100,
      max: Math.round(expectedRange.max * 100) / 100,
    },
    deviationFromMean: Math.round(deviationFromMean * 100) / 100,
    zScore: Math.round(zScore * 100) / 100,
    similarRows,
  };
}

/**
 * Compare total to filtered subset
 */
export function compareToTotal(
  allData: DataRow[],
  filteredData: DataRow[],
  analyzeColumn: string
): {
  totalStats: any;
  filteredStats: any;
  differences: any;
  filterImpact: string;
} {
  const totalStats = calculateSegmentStats(allData, analyzeColumn);
  const filteredStats = calculateSegmentStats(filteredData, analyzeColumn);

  const meanDiff = totalStats.mean && filteredStats.mean
    ? filteredStats.mean - totalStats.mean
    : 0;
  const meanDiffPercent = totalStats.mean
    ? (meanDiff / totalStats.mean) * 100
    : 0;

  let filterImpact = '';
  if (Math.abs(meanDiffPercent) < 5) {
    filterImpact = '✅ Filter has minimal impact on average';
  } else if (meanDiffPercent > 10) {
    filterImpact = '⚠️ Filter significantly increases average';
  } else if (meanDiffPercent < -10) {
    filterImpact = '⚠️ Filter significantly decreases average';
  } else {
    filterImpact = '📊 Filter has moderate impact on average';
  }

  return {
    totalStats,
    filteredStats,
    differences: {
      rowCountDiff: filteredData.length - allData.length,
      rowCountPercent: (filteredData.length / allData.length) * 100,
      meanDiff: Math.round(meanDiff * 100) / 100,
      meanDiffPercent: Math.round(meanDiffPercent * 100) / 100,
    },
    filterImpact,
  };
}

// ==================== Helper Functions ====================

/**
 * Calculate statistics for a segment
 */
function calculateSegmentStats(
  data: DataRow[],
  column?: string
): {
  rowCount: number;
  mean?: number;
  median?: number;
  stdev?: number;
  min?: number;
  max?: number;
} {
  const stats = {
    rowCount: data.length,
  };

  if (!column) return stats;

  const values = data
    .map((row) => row[column])
    .filter((val) => typeof val === 'number') as number[];

  if (values.length === 0) return stats;

  const sorted = [...values].sort((a, b) => a - b);

  return {
    ...stats,
    mean: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
    median:
      values.length % 2 === 0
        ? Math.round(((sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2) * 100) / 100
        : Math.round(sorted[Math.floor(values.length / 2)] * 100) / 100,
    stdev: Math.round(
      Math.sqrt(
        values.reduce(
          (a, b) => a + Math.pow(b - (values.reduce((x, y) => x + y, 0) / values.length), 2),
          0
        ) / values.length
      ) * 100
    ) / 100,
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100,
  };
}

/**
 * Get drill-down breadcrumb for navigation
 */
export function getBreadcrumb(
  filters: Array<{ column: string; value: string | number }>
): string {
  if (filters.length === 0) return 'All Data';
  return filters.map((f) => `${f.column}: ${f.value}`).join(' → ');
}
