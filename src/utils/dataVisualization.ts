// Data visualization and charting utilities
import type { DataRow } from '../types';

export interface ChartData {
  name: string;
  value: number;
  count?: number;
}

export interface DistributionData {
  range: string;
  count: number;
  percentage: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  count?: number;
}

// Generate histogram/distribution data for numeric columns
export const generateDistribution = (
  data: DataRow[],
  columnName: string,
  buckets: number = 10
): DistributionData[] => {
  const values = data
    .map((row) => {
      const val = row[columnName];
      return typeof val === 'number' ? val : parseFloat(String(val));
    })
    .filter((val) => !isNaN(val));

  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const bucketSize = (max - min) / buckets || 1;

  const bucketCounts = new Array(buckets).fill(0);

  values.forEach((val) => {
    const bucketIndex = Math.min(
      buckets - 1,
      Math.floor((val - min) / bucketSize)
    );
    bucketCounts[bucketIndex]++;
  });

  return bucketCounts.map((count, index) => {
    const rangeStart = (min + index * bucketSize).toFixed(2);
    const rangeEnd = (min + (index + 1) * bucketSize).toFixed(2);
    const percentage = ((count / values.length) * 100).toFixed(1);

    return {
      range: `${rangeStart} - ${rangeEnd}`,
      count,
      percentage: `${percentage}%`,
    };
  });
};

// Generate bar chart data for categorical columns
export const generateCategoryChart = (
  data: DataRow[],
  columnName: string,
  topN: number = 10
): ChartData[] => {
  const counts: Record<string, number> = {};

  data.forEach((row) => {
    const val = String(row[columnName] || 'Unknown');
    counts[val] = (counts[val] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({
      name: name.length > 20 ? name.substring(0, 17) + '...' : name,
      value,
    }));
};

// Generate time series data if date column exists
export const generateTimeSeries = (
  data: DataRow[],
  dateColumn: string,
  valueColumn?: string
): TimeSeriesData[] => {
  const timeMap: Record<string, number> = {};

  data.forEach((row) => {
    const dateStr = String(row[dateColumn]);
    const isValidDate = !isNaN(Date.parse(dateStr));

    if (isValidDate) {
      const date = new Date(dateStr);
      const key = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (valueColumn && typeof row[valueColumn] === 'number') {
        timeMap[key] = (timeMap[key] || 0) + row[valueColumn];
      } else {
        timeMap[key] = (timeMap[key] || 0) + 1;
      }
    }
  });

  return Object.entries(timeMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, value]) => ({
      date,
      value: Math.round(value * 100) / 100,
    }));
};

// Generate correlation heatmap data
export const generateCorrelationMatrix = (
  data: DataRow[],
  columns: string[]
): { row: string; col: string; value: number }[] => {
  const numericColumns = columns.filter((col) => {
    return data.some((row) => typeof row[col] === 'number');
  });

  const result: { row: string; col: string; value: number }[] = [];

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];

      const values1 = data.map((r) => Number(r[col1])).filter((v) => !isNaN(v));
      const values2 = data.map((r) => Number(r[col2])).filter((v) => !isNaN(v));

      if (values1.length === 0 || values2.length === 0) continue;

      const corr = calculatePearsonCorrelation(values1, values2);

      result.push({
        row: col1,
        col: col2,
        value: Math.round(corr * 100) / 100,
      });

      if (i !== j) {
        result.push({
          row: col2,
          col: col1,
          value: Math.round(corr * 100) / 100,
        });
      }
    }
  }

  return result;
};

// Calculate Pearson correlation coefficient
export const calculatePearsonCorrelation = (
  array1: number[],
  array2: number[]
): number => {
  const n = Math.min(array1.length, array2.length);
  if (n === 0) return 0;

  const mean1 = array1.reduce((a, b) => a + b) / n;
  const mean2 = array2.reduce((a, b) => a + b) / n;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = array1[i] - mean1;
    const diff2 = array2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(denom1 * denom2);
  return denominator === 0 ? 0 : numerator / denominator;
};

// Detect if column contains datetime
export const isDateColumn = (data: DataRow[], columnName: string): boolean => {
  const sample = data.slice(0, 10);
  let validDates = 0;

  sample.forEach((row) => {
    const val = String(row[columnName]);
    if (!isNaN(Date.parse(val)) && val.length >= 8) {
      validDates++;
    }
  });

  return validDates >= sample.length * 0.8;
};

// Generate box plot data for outlier visualization
export const generateBoxPlot = (
  data: DataRow[],
  columnName: string
): { min: number; q1: number; median: number; q3: number; max: number; outliers: number[] } => {
  const values = data
    .map((row) => {
      const val = row[columnName];
      return typeof val === 'number' ? val : parseFloat(String(val));
    })
    .filter((val) => !isNaN(val))
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: [] };
  }

  const min = values[0];
  const max = values[values.length - 1];
  const median =
    values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

  const q1 = values[Math.floor(values.length / 4)];
  const q3 = values[Math.floor((values.length * 3) / 4)];

  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = values.filter((v) => v < lowerBound || v > upperBound);

  return { min, q1, median, q3, max, outliers };
};

// Generate summary statistics for a numeric column
export const generateColumnStatistics = (
  data: DataRow[],
  columnName: string
): {
  mean: number;
  median: number;
  stdev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
} => {
  const values = data
    .map((row) => {
      const val = row[columnName];
      return typeof val === 'number' ? val : parseFloat(String(val));
    })
    .filter((val) => !isNaN(val))
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return { mean: 0, median: 0, stdev: 0, min: 0, max: 0, q1: 0, q3: 0, iqr: 0 };
  }

  const mean = values.reduce((a, b) => a + b) / values.length;
  const median =
    values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdev = Math.sqrt(variance);

  const min = values[0];
  const max = values[values.length - 1];
  const q1 = values[Math.floor(values.length / 4)];
  const q3 = values[Math.floor((values.length * 3) / 4)];
  const iqr = q3 - q1;

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdev: Math.round(stdev * 100) / 100,
    min,
    max,
    q1,
    q3,
    iqr,
  };
};

// Segment analysis - group by column and aggregate
export const segmentAnalysis = (
  data: DataRow[],
  groupByColumn: string,
  aggregateColumn: string,
  aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
): ChartData[] => {
  const segments: Record<string, number[]> = {};

  data.forEach((row) => {
    const groupKey = String(row[groupByColumn] || 'Unknown');
    const value = Number(row[aggregateColumn]) || 0;

    if (!segments[groupKey]) {
      segments[groupKey] = [];
    }
    segments[groupKey].push(value);
  });

  const results = Object.entries(segments)
    .map(([name, values]) => {
      let aggregated = 0;

      switch (aggregationType) {
        case 'sum':
          aggregated = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregated = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          aggregated = values.length;
          break;
        case 'min':
          aggregated = Math.min(...values);
          break;
        case 'max':
          aggregated = Math.max(...values);
          break;
      }

      return {
        name: name.length > 20 ? name.substring(0, 17) + '...' : name,
        value: Math.round(aggregated * 100) / 100,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return results;
};
