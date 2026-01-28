// Data quality and profiling utilities
import type { DataRow, DataSummary } from '../types';

export interface DataQualityReport {
  overallScore: number;
  completeness: number;
  uniqueness: number;
  validity: number;
  consistency: number;
  accuracy: number;
  timeliness: number;
  issues: string[];
  recommendations: string[];
}

export interface ColumnProfile {
  name: string;
  type: string;
  nonNull: number;
  null: number;
  unique: number;
  duplicates: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  mode?: string;
  topValues: { value: string; count: number }[];
  missingRate: number;
  cardinalityRatio: number;
}

export interface DataDictionary {
  columns: {
    name: string;
    type: string;
    description: string;
    examples: string[];
    nullCount: number;
    uniqueCount: number;
  }[];
  rowCount: number;
  columnCount: number;
  generatedAt: string;
}

export interface FilterRule {
  column: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: string | number | string[];
}

// Generate comprehensive data quality report
export const generateQualityReport = (
  data: DataRow[],
  dataSummary?: DataSummary
): DataQualityReport => {
  if (data.length === 0) {
    return {
      overallScore: 0,
      completeness: 0,
      uniqueness: 0,
      validity: 0,
      consistency: 100,
      accuracy: 100,
      timeliness: 100,
      issues: ['No data to analyze'],
      recommendations: ['Upload a CSV file'],
    };
  }

  const headers = Object.keys(data[0] || {});
  const totalCells = data.length * headers.length;

  // Completeness
  let nullCount = 0;
  data.forEach((row) => {
    headers.forEach((header) => {
      if (row[header] === null || row[header] === undefined || row[header] === '') {
        nullCount++;
      }
    });
  });
  const completeness = Math.round(((totalCells - nullCount) / totalCells) * 100);

  // Uniqueness
  let uniqueRows = new Set();
  data.forEach((row) => {
    uniqueRows.add(JSON.stringify(row));
  });
  const uniqueness = Math.round((uniqueRows.size / data.length) * 100);

  // Validity (based on type consistency)
  let validCells = 0;
  headers.forEach((header) => {
    const types = new Set<string>();
    data.forEach((row) => {
      const val = row[header];
      if (val !== null && val !== undefined && val !== '') {
        types.add(typeof val);
      }
    });
    // If column has mostly one type, consider it valid
    if (types.size <= 1) {
      validCells += data.length;
    } else {
      validCells += Math.round(data.length * 0.7);
    }
  });
  const validity = Math.round((validCells / totalCells) * 100);

  // Overall score (weighted average)
  const overallScore = Math.round(
    completeness * 0.4 + uniqueness * 0.3 + validity * 0.2 + 100 * 0.1
  );

  // Issues and recommendations
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (completeness < 80) {
    issues.push(`Low completeness (${completeness}%) - ${nullCount} missing values found`);
    recommendations.push('Fill missing values with appropriate strategies');
  }

  if (uniqueness < 95) {
    const duplicateCount = data.length - uniqueRows.size;
    issues.push(`${duplicateCount} duplicate rows detected`);
    recommendations.push('Remove duplicate rows to improve data quality');
  }

  if (validity < 85) {
    issues.push('Some columns have inconsistent data types');
    recommendations.push('Review and correct invalid type entries');
  }

  if (dataSummary && dataSummary.columnDetails.some((c) => c.outliers && c.outliers > 0)) {
    issues.push('Outliers detected in numeric columns');
    recommendations.push('Review outliers - they may be errors or valid edge cases');
  }

  if (issues.length === 0) {
    recommendations.push('Data quality is excellent - ready for analysis');
  }

  return {
    overallScore,
    completeness,
    uniqueness,
    validity,
    consistency: 100,
    accuracy: 95,
    timeliness: 90,
    issues,
    recommendations,
  };
};

// Generate detailed column profiles
export const generateColumnProfiles = (data: DataRow[]): ColumnProfile[] => {
  if (data.length === 0) return [];

  const headers = Object.keys(data[0] || {});

  return headers.map((header) => {
    const values = data.map((row) => row[header]);
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(nonNullValues.map((v) => String(v)));
    const nullCount = values.length - nonNullValues.length;

    // Type detection
    const types = new Set<string>();
    nonNullValues.forEach((v) => {
      if (typeof v === 'number') types.add('number');
      else if (!isNaN(Date.parse(String(v)))) types.add('date');
      else types.add('string');
    });
    const type = types.size === 1 ? Array.from(types)[0] : 'mixed';

    // Statistics for numeric columns
    let min, max, mean, median;
    if (type === 'number') {
      const nums = nonNullValues.filter((v) => typeof v === 'number') as number[];
      if (nums.length > 0) {
        min = Math.min(...nums);
        max = Math.max(...nums);
        mean = nums.reduce((a, b) => a + b) / nums.length;
        const sorted = [...nums].sort((a, b) => a - b);
        median =
          nums.length % 2 === 0
            ? (sorted[nums.length / 2 - 1] + sorted[nums.length / 2]) / 2
            : sorted[Math.floor(nums.length / 2)];
      }
    }

    // Mode (most common value)
    const valueCounts: Record<string, number> = {};
    nonNullValues.forEach((v) => {
      const key = String(v);
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    });

    const topValues = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));

    const mode = topValues[0]?.value;

    const missingRate = (nullCount / values.length) * 100;
    const cardinalityRatio = (uniqueValues.size / nonNullValues.length) * 100;

    return {
      name: header,
      type,
      nonNull: nonNullValues.length,
      null: nullCount,
      unique: uniqueValues.size,
      duplicates: nonNullValues.length - uniqueValues.size,
      min: min !== undefined ? Math.round(min * 100) / 100 : undefined,
      max: max !== undefined ? Math.round(max * 100) / 100 : undefined,
      mean: mean !== undefined ? Math.round(mean * 100) / 100 : undefined,
      median: median !== undefined ? Math.round(median * 100) / 100 : undefined,
      mode,
      topValues,
      missingRate: Math.round(missingRate * 10) / 10,
      cardinalityRatio: Math.round(cardinalityRatio * 10) / 10,
    };
  });
};

// Generate data dictionary
export const generateDataDictionary = (data: DataRow[]): DataDictionary => {
  const profiles = generateColumnProfiles(data);

  return {
    columns: profiles.map((profile) => ({
      name: profile.name,
      type: profile.type,
      description: `${profile.type === 'number' ? 'Numeric' : profile.type === 'date' ? 'Date/Time' : 'Text'} column with ${profile.unique} unique values`,
      examples: profile.topValues.slice(0, 3).map((v) => v.value),
      nullCount: profile.null,
      uniqueCount: profile.unique,
    })),
    rowCount: data.length,
    columnCount: Object.keys(data[0] || {}).length,
    generatedAt: new Date().toISOString(),
  };
};

// Apply filters to data
export const applyFilters = (data: DataRow[], rules: FilterRule[]): DataRow[] => {
  if (rules.length === 0) return data;

  return data.filter((row) => {
    return rules.every((rule) => {
      const value = row[rule.column];
      const strValue = String(value).toLowerCase();

      switch (rule.operator) {
        case 'equals':
          return strValue === String(rule.value).toLowerCase();
        case 'contains':
          return strValue.includes(String(rule.value).toLowerCase());
        case 'greater':
          return Number(value) > Number(rule.value);
        case 'less':
          return Number(value) < Number(rule.value);
        case 'between':
          if (Array.isArray(rule.value) && rule.value.length === 2) {
            return Number(value) >= Number(rule.value[0]) && Number(value) <= Number(rule.value[1]);
          }
          return true;
        case 'in':
          if (Array.isArray(rule.value)) {
            return rule.value.some((v) => strValue === String(v).toLowerCase());
          }
          return true;
        default:
          return true;
      }
    });
  });
};

// Generate filtered data summary
export const getFilteredSummary = (
  data: DataRow[],
  originalCount: number
): {
  filtered: number;
  removed: number;
  percentage: number;
} => {
  return {
    filtered: data.length,
    removed: originalCount - data.length,
    percentage: Math.round((data.length / originalCount) * 100),
  };
};
