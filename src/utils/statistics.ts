/**
 * Advanced Statistical Analysis Utilities
 * Provides t-tests, chi-square, correlation p-values, confidence intervals, power analysis
 */

/**
 * Calculate t-test between two groups
 * Returns t-statistic, p-value, degrees of freedom, effect size (Cohen's d)
 */
export function tTest(group1: number[], group2: number[]): {
  tStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
  effectSize: number;
  significant: boolean;
  interpretation: string;
} {
  if (group1.length === 0 || group2.length === 0) {
    return {
      tStatistic: 0,
      pValue: 1,
      degreesOfFreedom: 0,
      effectSize: 0,
      significant: false,
      interpretation: 'Insufficient data',
    };
  }

  const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
  const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;

  const var1 =
    group1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (group1.length - 1);
  const var2 =
    group2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (group2.length - 1);

  const pooledVar = ((group1.length - 1) * var1 + (group2.length - 1) * var2) /
    (group1.length + group2.length - 2);
  const standardError = Math.sqrt(pooledVar * (1 / group1.length + 1 / group2.length));

  const tStatistic = (mean1 - mean2) / standardError;
  const df = group1.length + group2.length - 2;

  // Approximation of p-value using t-distribution (simplified)
  const pValue = 2 * (1 - tCDF(Math.abs(tStatistic), df));

  // Cohen's d effect size
  const pooledStd = Math.sqrt(pooledVar);
  const effectSize = (mean1 - mean2) / pooledStd;

  const significant = pValue < 0.05;
  let interpretation = '';

  if (!significant) {
    interpretation = 'No significant difference (p > 0.05)';
  } else if (Math.abs(effectSize) < 0.2) {
    interpretation = 'Significant but negligible effect';
  } else if (Math.abs(effectSize) < 0.5) {
    interpretation = 'Significant small effect';
  } else if (Math.abs(effectSize) < 0.8) {
    interpretation = 'Significant medium effect';
  } else {
    interpretation = 'Significant large effect';
  }

  return {
    tStatistic: Math.round(tStatistic * 100) / 100,
    pValue: Math.round(pValue * 10000) / 10000,
    degreesOfFreedom: df,
    effectSize: Math.round(effectSize * 100) / 100,
    significant,
    interpretation,
  };
}

/**
 * Calculate chi-square test for categorical data
 * Compares observed frequencies to expected frequencies
 */
export function chiSquareTest(observed: number[], expected: number[]): {
  chiSquare: number;
  pValue: number;
  degreesOfFreedom: number;
  significant: boolean;
  interpretation: string;
} {
  if (observed.length !== expected.length || observed.length < 2) {
    return {
      chiSquare: 0,
      pValue: 1,
      degreesOfFreedom: 0,
      significant: false,
      interpretation: 'Invalid data',
    };
  }

  let chiSquare = 0;
  for (let i = 0; i < observed.length; i++) {
    if (expected[i] > 0) {
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
  }

  const df = observed.length - 1;
  const pValue = 1 - chiSquareCDF(chiSquare, df);
  const significant = pValue < 0.05;

  let interpretation = '';
  if (!significant) {
    interpretation = 'No significant difference from expected distribution';
  } else {
    interpretation = 'Significant difference from expected distribution';
  }

  return {
    chiSquare: Math.round(chiSquare * 100) / 100,
    pValue: Math.round(pValue * 10000) / 10000,
    degreesOfFreedom: df,
    significant,
    interpretation,
  };
}

/**
 * Calculate Pearson correlation coefficient with p-value
 */
export function pearsonCorrelation(x: number[], y: number[]): {
  correlation: number;
  pValue: number;
  significant: boolean;
  strength: string;
} {
  if (x.length !== y.length || x.length < 3) {
    return {
      correlation: 0,
      pValue: 1,
      significant: false,
      strength: 'Insufficient data',
    };
  }

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const correlation = sumXY / Math.sqrt(sumX2 * sumY2);
  const tStat = (correlation * Math.sqrt(n - 2)) / Math.sqrt(1 - correlation * correlation);
  const pValue = 2 * (1 - tCDF(Math.abs(tStat), n - 2));

  const absCorr = Math.abs(correlation);
  let strength = '';
  if (absCorr < 0.3) strength = 'Weak';
  else if (absCorr < 0.5) strength = 'Moderate';
  else if (absCorr < 0.7) strength = 'Strong';
  else strength = 'Very Strong';

  return {
    correlation: Math.round(correlation * 10000) / 10000,
    pValue: Math.round(pValue * 10000) / 10000,
    significant: pValue < 0.05,
    strength,
  };
}

/**
 * Calculate confidence interval for a sample mean
 */
export function confidenceInterval(
  data: number[],
  confidence = 0.95
): {
  mean: number;
  lowerBound: number;
  upperBound: number;
  marginOfError: number;
  confidence: number;
} {
  if (data.length < 2) {
    return {
      mean: 0,
      lowerBound: 0,
      upperBound: 0,
      marginOfError: 0,
      confidence,
    };
  }

  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(
    data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (data.length - 1)
  );

  // t-value for 95% confidence with n-1 df (simplified: use ~1.96 for large n)
  const tValue = data.length > 30 ? 1.96 : tValueFromDF(data.length - 1);
  const marginOfError = tValue * (std / Math.sqrt(data.length));

  return {
    mean: Math.round(mean * 100) / 100,
    lowerBound: Math.round((mean - marginOfError) * 100) / 100,
    upperBound: Math.round((mean + marginOfError) * 100) / 100,
    marginOfError: Math.round(marginOfError * 100) / 100,
    confidence,
  };
}

/**
 * Calculate required sample size for A/B test
 * Given baseline conversion rate, effect size, alpha (Type I error), and power
 */
export function powerAnalysis(
  baselineRate: number,
  effectSize: number,
  alpha = 0.05,
  power = 0.8
): {
  requiredSampleSize: number;
  alpha: number;
  power: number;
  effectSize: number;
  interpretation: string;
} {
  // Two-proportion z-test sample size formula
  // n = 2 * ((Za + Zb)^2 * (p1*(1-p1) + p2*(1-p2))) / (p1 - p2)^2

  const zAlpha = zValue(1 - (alpha / 2));
  const zBeta = zValue(power);

  const p1 = baselineRate;
  const p2 = baselineRate + effectSize;

  const numerator = 2 * Math.pow(zAlpha + zBeta, 2) * 
    (p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = Math.pow(p1 - p2, 2);

  const sampleSize = Math.ceil(numerator / denominator);

  let interpretation = `Need ${sampleSize} samples per group (${sampleSize * 2} total) `;
  interpretation += `to detect ${(effectSize * 100).toFixed(1)}% change `;
  interpretation += `with ${(power * 100).toFixed(0)}% power and ${(alpha * 100).toFixed(1)}% significance level`;

  return {
    requiredSampleSize: sampleSize,
    alpha,
    power,
    effectSize,
    interpretation,
  };
}

/**
 * Significance level interpretation
 */
export function getSignificanceLabel(pValue: number): string {
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  return 'ns';
}

/**
 * Significance interpretation in words
 */
export function interpretPValue(pValue: number): string {
  if (pValue < 0.001) return 'Highly significant (p < 0.001)';
  if (pValue < 0.01) return 'Very significant (p < 0.01)';
  if (pValue < 0.05) return 'Significant (p < 0.05)';
  if (pValue < 0.1) return 'Marginally significant (p < 0.1)';
  return 'Not significant (p ≥ 0.1)';
}

// =================== Helper Functions ===================

/**
 * Cumulative distribution function for t-distribution (simplified approximation)
 */
function tCDF(t: number, df: number): number {
  // Using approximation for t-distribution
  const x = df / (df + t * t);
  return betaIncomplete(df / 2, 0.5, x);
}

/**
 * Approximation of regularized incomplete beta function
 */
function betaIncomplete(a: number, b: number, x: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta(a, b));

  let f = 1,
    c = 1,
    d = 0;
  for (let i = 0; i <= 100; i++) {
    let m = i;
    if (i === 0) {
      d = 1;
    } else {
      const x2term =
        (-(a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1 + x2term * d;
      d = d === 0 ? 1e-10 : 1 / d;
      const numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
      c = 1 + numerator / c;
      c = c === 0 ? 1e-10 : 1 / c;
      f = f * c * d;
    }
    if (Math.abs(c * d - 1) < 1e-8) break;
  }

  return Math.min(1, Math.max(0, front * f));
}

/**
 * Log of beta function
 */
function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

/**
 * Log gamma function approximation
 */
function logGamma(x: number): number {
  const g = 7;
  const coeff = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * x)) - logGamma(1 - x);
  }

  x -= 1;
  let base = x + g + 0.5;
  let sum = coeff[0];

  for (let i = 1; i < coeff.length; i++) {
    sum += coeff[i] / (x + i);
  }

  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(base) - base + Math.log(sum);
}

/**
 * Chi-square CDF approximation
 */
function chiSquareCDF(x: number, df: number): number {
  return betaIncomplete(df / 2, 0.5, x / (x + df));
}

/**
 * Z-value for standard normal distribution
 */
function zValue(p: number): number {
  // Approximation using inverse error function
  if (p === 0.5) return 0;
  if (p < 0.5) return -zValue(1 - p);

  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;

  return t - ((c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t));
}

/**
 * T-value for given confidence level and degrees of freedom
 * Returns approximate critical t-value
 */
function tValueFromDF(df: number): number {
  // Simplified t-value lookup
  const lookup: Record<string, number> = {
    '1': 12.706,
    '2': 4.303,
    '3': 3.182,
    '4': 2.776,
    '5': 2.571,
    '10': 2.228,
    '20': 2.086,
    '30': 2.042,
  };

    return lookup[df.toString()];
  if (df >= 30) return 1.96; // Normal approximation
  return lookup['30'] || 2.042;
}
