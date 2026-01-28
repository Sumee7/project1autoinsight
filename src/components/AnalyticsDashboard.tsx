import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Download,
  Zap,
  BarChart3,
} from 'lucide-react';
import type { DataRow, DataSummary } from '../types';
import {
  generateDistribution,
  generateCategoryChart,
  isDateColumn,
  generateColumnStatistics,
  generateTimeSeries,
} from '../utils/dataVisualization';
import { detectAnomaliesZScore, detectTrend } from '../utils/analytics';
import { pearsonCorrelation, confidenceInterval, tTest, getSignificanceLabel } from '../utils/statistics';
import { drillDownByValue, compareSegments } from '../utils/drillDown';

interface AnalyticsDashboardProps {
  data: DataRow[];
  dataSummary?: DataSummary;
  onExport?: () => void;
}

export default function AnalyticsDashboard({
  data,
  onExport,
}: AnalyticsDashboardProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>(
    Object.keys(data[0] || {})[0] || ''
  );
  const [showStatistics, setShowStatistics] = useState(false);
  const [drillDownValue, setDrillDownValue] = useState<string | number | null>(null);
  const [drillDownData, setDrillDownData] = useState<DataRow[]>([]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Upload data to see analytics
      </div>
    );
  }

  const headers = Object.keys(data[0] || {});
  const numericColumns = headers.filter((col) =>
    data.some((row) => typeof row[col] === 'number')
  );
  const isNumeric = selectedColumn && numericColumns.includes(selectedColumn);
  const isDate = selectedColumn && isDateColumn(data, selectedColumn);

  // Generate visualizations
  const distributionData = isNumeric ? generateDistribution(data, selectedColumn) : [];
  const categoryData = !isNumeric ? generateCategoryChart(data, selectedColumn) : [];
  const stats = isNumeric ? generateColumnStatistics(data, selectedColumn) : null;
  const anomalies = isNumeric ? detectAnomaliesZScore(data, selectedColumn) : [];

  // Trend analysis
  const timeSeriesData = isDate ? generateTimeSeries(data, selectedColumn) : [];
  const trend = timeSeriesData.length > 1 ? detectTrend(timeSeriesData.map((d) => d.value)) : null;

  return (
    <div className="space-y-6">
      {/* Column Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          📊 Select Column to Analyze
        </label>
        <select
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-white rounded-lg"
        >
          {headers.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics Cards */}
      {isNumeric && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400">Mean</div>
              <div className="text-2xl font-bold text-blue-400">{stats.mean}</div>
            </div>
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400">Median</div>
              <div className="text-2xl font-bold text-green-400">{stats.median}</div>
            </div>
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400">Std Dev</div>
              <div className="text-2xl font-bold text-purple-400">{stats.stdev}</div>
            </div>
            <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400">Range</div>
              <div className="text-2xl font-bold text-orange-400">
                {stats.max - stats.min}
              </div>
            </div>
          </div>

          {/* Confidence Interval */}
          {(() => {
            const ci = confidenceInterval(
              data
                .map((row) => row[selectedColumn])
                .filter((val) => typeof val === 'number') as number[],
              0.95
            );
            return (
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-300">95% Confidence Interval</span>
                </div>
                <div className="text-sm text-gray-300">
                  [{ci.lowerBound}, {ci.upperBound}] ± {ci.marginOfError}
                </div>
              </div>
            );
          })()}

          {/* Statistical Tests Toggle */}
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all text-sm font-semibold"
          >
            <BarChart3 className="w-4 h-4" />
            {showStatistics ? 'Hide' : 'Show'} Statistical Tests
          </button>

          {/* Statistical Tests Results */}
          {showStatistics && (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">📊 Statistical Analysis</h3>
              
              {(() => {
                const numValues = data
                  .map((row) => row[selectedColumn])
                  .filter((val) => typeof val === 'number') as number[];
                
                if (numValues.length < 2) return <p className="text-xs text-gray-500">Insufficient data</p>;

                // Split data in half for t-test
                const mid = Math.floor(numValues.length / 2);
                const group1 = numValues.slice(0, mid);
                const group2 = numValues.slice(mid);
                const testResult = tTest(group1, group2);

                return (
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-700/20 rounded">
                      <div className="text-xs font-semibold text-gray-300 mb-1">T-Test (Group Comparison)</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>t-statistic: <span className="text-gray-300">{testResult.tStatistic}</span></div>
                        <div>p-value: <span className={testResult.pValue < 0.05 ? 'text-orange-400' : 'text-green-400'}>{testResult.pValue} {getSignificanceLabel(testResult.pValue)}</span></div>
                        <div className="col-span-2">Effect Size: <span className="text-gray-300">{testResult.effectSize}</span></div>
                        <div className="col-span-2 text-gray-400">{testResult.interpretation}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* Distribution Chart */}
      {isNumeric && distributionData.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Chart */}
      {!isNumeric && categoryData.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📈 Top Values</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Time Series */}
      {isDate && timeSeriesData.length > 1 && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">📈 Time Series Trend</h3>
            {trend && (
              <div className="flex items-center gap-2">
                {trend.trend === 'increasing' ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : trend.trend === 'decreasing' ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <Activity className="w-5 h-5 text-yellow-400" />
                )}
                <span className="text-sm text-gray-400">
                  {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                </span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Anomalies */}
      {isNumeric && anomalies.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">
              Anomalies Detected ({anomalies.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {anomalies.slice(0, 10).map((anomaly) => (
              <div
                key={anomaly.rowIndex}
                className={`p-3 rounded-lg border ${
                  anomaly.severity === 'high'
                    ? 'bg-red-900/20 border-red-500/30'
                    : anomaly.severity === 'medium'
                      ? 'bg-yellow-900/20 border-yellow-500/30'
                      : 'bg-blue-900/20 border-blue-500/30'
                }`}
              >
                <div className="text-sm font-semibold text-gray-300">Row {anomaly.rowIndex}</div>
                <div className="text-xs text-gray-400">{anomaly.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      {onExport && (
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          <Download className="w-5 h-5" />
          Export Analysis Report
        </button>
      )}
    </div>
  );
}
