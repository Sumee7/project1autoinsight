// Advanced analytics utilities
import type { DataRow } from '../types';

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  startValue: number;
  endValue: number;
  change: number;
  changePercent: number;
  slope: number;
}

export interface AnomalyResult {
  rowIndex: number;
  value: number;
  zscore: number;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

export interface SegmentComparison {
  segment: string;
  count: number;
  percentage: number;
  metrics: Record<string, number>;
}

// Detect trends in time series data
export const detectTrend = (
  values: number[]
): TrendAnalysis => {
  if (values.length < 2) {
    return {
      trend: 'stable',
      startValue: values[0] || 0,
      endValue: values[values.length - 1] || 0,
      change: 0,
      changePercent: 0,
      slope: 0,
    };
  }

  const n = values.length;
  const startValue = values[0];
  const endValue = values[n - 1];
  const change = endValue - startValue;
  const changePercent = startValue !== 0 ? (change / startValue) * 100 : 0;

  // Calculate slope using linear regression
  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = x.reduce((a, b) => a + b) / n;
  const yMean = values.reduce((a, b) => a + b) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (values[i] - yMean);
    denominator += (x[i] - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  const trend =
    Math.abs(slope) < 0.01
      ? 'stable'
      : slope > 0
        ? 'increasing'
        : 'decreasing';

  return {
    trend,
    startValue,
    endValue,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    slope: Math.round(slope * 10000) / 10000,
  };
};

// Detect anomalies using Z-score method
export const detectAnomaliesZScore = (
  data: DataRow[],
  columnName: string,
  threshold: number = 2.5
): AnomalyResult[] => {
  const values = data
    .map((row) => Number(row[columnName]))
    .filter((v) => !isNaN(v));

  if (values.length < 3) return [];

  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);

  if (stdev === 0) return [];

  const anomalies: AnomalyResult[] = [];

  data.forEach((row, index) => {
    const value = Number(row[columnName]);
    if (isNaN(value)) return;

    const zscore = (value - mean) / stdev;

    if (Math.abs(zscore) > threshold) {
      const severity =
        Math.abs(zscore) > 3.5
          ? 'high'
          : Math.abs(zscore) > 3
            ? 'medium'
            : 'low';

      anomalies.push({
        rowIndex: index,
        value,
        zscore: Math.round(zscore * 100) / 100,
        severity,
        reason: `Value ${value} is ${Math.abs(zscore).toFixed(2)} standard deviations from mean (${Math.round(mean)})`,
      });
    }
  });

  return anomalies.sort((a, b) => Math.abs(b.zscore) - Math.abs(a.zscore));
};

// Cohort analysis - group users by signup date
export const cohortAnalysis = (
  data: DataRow[],
  dateColumn: string,
  metricColumn: string,
  bucketType: 'month' | 'week' | 'day' = 'month'
): SegmentComparison[] => {
  const cohorts: Record<string, number[]> = {};

  data.forEach((row) => {
    const dateStr = String(row[dateColumn]);
    const metricVal = Number(row[metricColumn]) || 0;

    if (!isNaN(Date.parse(dateStr))) {
      const date = new Date(dateStr);
      let key: string;

      switch (bucketType) {
        case 'month':
          key = date.toISOString().substring(0, 7);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().substring(0, 10);
          break;
        case 'day':
          key = date.toISOString().substring(0, 10);
          break;
      }

      if (!cohorts[key]) cohorts[key] = [];
      cohorts[key].push(metricVal);
    }
  });

  return Object.entries(cohorts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([segment, values]) => ({
      segment,
      count: values.length,
      percentage: Math.round((values.length / data.length) * 100),
      metrics: {
        sum: Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100,
        avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
        min: Math.min(...values),
        max: Math.max(...values),
      },
    }));
};

// A/B test analysis
export const abTestAnalysis = (
  data: DataRow[],
  groupColumn: string,
  metricColumn: string
): Record<string, { count: number; mean: number; stdev: number; total: number }> => {
  const groups: Record<string, number[]> = {};

  data.forEach((row) => {
    const group = String(row[groupColumn] || 'Unknown');
    const metric = Number(row[metricColumn]) || 0;

    if (!groups[group]) groups[group] = [];
    groups[group].push(metric);
  });

  const results: Record<string, { count: number; mean: number; stdev: number; total: number }> =
    {};

  Object.entries(groups).forEach(([group, values]) => {
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / count;
    const stdev = Math.sqrt(variance);

    results[group] = {
      count,
      mean: Math.round(mean * 100) / 100,
      stdev: Math.round(stdev * 100) / 100,
      total: Math.round(sum * 100) / 100,
    };
  });

  return results;
};

// RFM Analysis (Recency, Frequency, Monetary)
export const rfmAnalysis = (
  data: DataRow[],
  customerColumn: string,
  dateColumn: string,
  amountColumn: string,
  referenceDate: Date = new Date()
): Record<
  string,
  {
    recency: number;
    frequency: number;
    monetary: number;
    rfmScore: string;
  }
> => {
  const customers: Record<
    string,
    {
      dates: Date[];
      amounts: number[];
    }
  > = {};

  data.forEach((row) => {
    const customer = String(row[customerColumn]);
    const dateStr = String(row[dateColumn]);
    const amount = Number(row[amountColumn]) || 0;

    if (!isNaN(Date.parse(dateStr))) {
      if (!customers[customer]) {
        customers[customer] = { dates: [], amounts: [] };
      }
      customers[customer].dates.push(new Date(dateStr));
      customers[customer].amounts.push(amount);
    }
  });

  const results: Record<
    string,
    { recency: number; frequency: number; monetary: number; rfmScore: string }
  > = {};

  Object.entries(customers).forEach(([customer, { dates, amounts }]) => {
    // Recency: days since last purchase
    const lastPurchase = new Date(Math.max(...dates.map((d) => d.getTime())));
    const recency = Math.floor(
      (referenceDate.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Frequency: number of purchases
    const frequency = dates.length;

    // Monetary: total spent
    const monetary = amounts.reduce((a, b) => a + b, 0);

    // RFM Score: Rank each dimension and combine
    let rfmScore = '';

    // Simplified scoring: Low/Medium/High for each dimension
    const recencyScore = recency <= 30 ? 'High' : recency <= 90 ? 'Medium' : 'Low';
    const frequencyScore = frequency >= 10 ? 'High' : frequency >= 5 ? 'Medium' : 'Low';
    const monetaryScore = monetary >= 1000 ? 'High' : monetary >= 500 ? 'Medium' : 'Low';

    rfmScore = `${recencyScore[0]}${frequencyScore[0]}${monetaryScore[0]}`;

    results[customer] = {
      recency,
      frequency,
      monetary: Math.round(monetary * 100) / 100,
      rfmScore,
    };
  });

  return results;
};

// Churn prediction indicators
export const churnIndicators = (
  data: DataRow[],
  dateColumn: string,
  activityColumn: string,
  referenceDate: Date = new Date()
): Array<{
  rowIndex: number;
  daysInactive: number;
  activityLevel: string;
  churnRisk: 'high' | 'medium' | 'low';
}> => {
  const results: Array<{
    rowIndex: number;
    daysInactive: number;
    activityLevel: string;
    churnRisk: 'high' | 'medium' | 'low';
  }> = [];

  data.forEach((row, index) => {
    const dateStr = String(row[dateColumn]);
    const activity = Number(row[activityColumn]) || 0;

    if (!isNaN(Date.parse(dateStr))) {
      const lastActivity = new Date(dateStr);
      const daysInactive = Math.floor(
        (referenceDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      const activityLevel = activity > 50 ? 'High' : activity > 20 ? 'Medium' : 'Low';

      let churnRisk: 'high' | 'medium' | 'low' = 'low';
      if (daysInactive > 180 || (daysInactive > 90 && activity < 20)) {
        churnRisk = 'high';
      } else if (daysInactive > 60 || (daysInactive > 30 && activity < 50)) {
        churnRisk = 'medium';
      }

      results.push({
        rowIndex: index,
        daysInactive,
        activityLevel,
        churnRisk,
      });
    }
  });

  return results;
};

// Conversion funnel analysis
export const funnelAnalysis = (
  data: DataRow[],
  steps: Array<{ columnName: string; label: string }>
): Array<{ step: string; count: number; percentage: number; dropoff: number }> => {
  const results: Array<{ step: string; count: number; percentage: number; dropoff: number }> = [];

  let previousCount = 0;

  steps.forEach((step, index) => {
    const count = data.filter((row) => row[step.columnName]).length;
    const percentage = (count / data.length) * 100;
    const dropoff = index === 0 ? 0 : previousCount > 0 ? Math.round(((previousCount - count) / previousCount) * 100) : 0;

    results.push({
      step: step.label,
      count,
      percentage: Math.round(percentage * 10) / 10,
      dropoff,
    });

    previousCount = count;
  });

  return results;
};
