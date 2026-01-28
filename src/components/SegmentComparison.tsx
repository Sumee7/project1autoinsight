import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SegmentComparison } from '../utils/drillDown';

interface SegmentComparisonUIProps {
  comparison: SegmentComparison;
}

export default function SegmentComparisonUI({ comparison }: SegmentComparisonUIProps) {
  return (
    <div className="space-y-6">
      {/* Segment Overview */}
      <div className="grid grid-cols-2 gap-4">
        {/* Segment 1 */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-300 mb-3">📊 {comparison.segment1.name}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Row Count:</span>
              <span className="text-sm font-bold text-gray-200">{comparison.segment1.rowCount}</span>
            </div>
            {comparison.segment1.mean !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Average:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment1.mean}</span>
              </div>
            )}
            {comparison.segment1.median !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Median:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment1.median}</span>
              </div>
            )}
            {comparison.segment1.stdev !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Std Dev:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment1.stdev}</span>
              </div>
            )}
            {comparison.segment1.min !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Min:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment1.min}</span>
              </div>
            )}
            {comparison.segment1.max !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Max:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment1.max}</span>
              </div>
            )}
          </div>
        </div>

        {/* Segment 2 */}
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-purple-300 mb-3">📊 {comparison.segment2.name}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Row Count:</span>
              <span className="text-sm font-bold text-gray-200">{comparison.segment2.rowCount}</span>
            </div>
            {comparison.segment2.mean !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Average:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment2.mean}</span>
              </div>
            )}
            {comparison.segment2.median !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Median:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment2.median}</span>
              </div>
            )}
            {comparison.segment2.stdev !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Std Dev:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment2.stdev}</span>
              </div>
            )}
            {comparison.segment2.min !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Min:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment2.min}</span>
              </div>
            )}
            {comparison.segment2.max !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Max:</span>
                <span className="text-sm font-bold text-gray-200">{comparison.segment2.max}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Differences */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">⚖️ Differences</h3>
        <div className="space-y-3">
          {/* Row Count Difference */}
          <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Row Count Diff:</span>
              {comparison.differences.rowCountDiff > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : comparison.differences.rowCountDiff < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-200">
                {comparison.differences.rowCountDiff > 0 ? '+' : ''}
                {comparison.differences.rowCountDiff}
              </div>
              <div
                className={`text-xs font-semibold ${
                  comparison.differences.rowCountDiffPercent > 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {comparison.differences.rowCountDiffPercent > 0 ? '+' : ''}
                {comparison.differences.rowCountDiffPercent}%
              </div>
            </div>
          </div>

          {/* Mean Difference */}
          {comparison.differences.meanDiff !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded">
              <span className="text-sm text-gray-400">Mean Difference:</span>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-200">
                  {comparison.differences.meanDiff > 0 ? '+' : ''}
                  {comparison.differences.meanDiff}
                </div>
                <div
                  className={`text-xs font-semibold ${
                    comparison.differences.meanDiffPercent > 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {comparison.differences.meanDiffPercent > 0 ? '+' : ''}
                  {comparison.differences.meanDiffPercent}%
                </div>
              </div>
            </div>
          )}

          {/* Median Difference */}
          {comparison.differences.medianDiff !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded">
              <span className="text-sm text-gray-400">Median Difference:</span>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-200">
                  {comparison.differences.medianDiff > 0 ? '+' : ''}
                  {comparison.differences.medianDiff}
                </div>
              </div>
            </div>
          )}

          {/* Std Dev Difference */}
          {comparison.differences.stdevDiff !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded">
              <span className="text-sm text-gray-400">Std Dev Difference:</span>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-200">
                  {comparison.differences.stdevDiff > 0 ? '+' : ''}
                  {comparison.differences.stdevDiff}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Significance Badge */}
      <div
        className={`border rounded-lg p-4 ${
          comparison.isDifferentSignificant
            ? 'bg-orange-900/20 border-orange-500/30'
            : 'bg-green-900/20 border-green-500/30'
        }`}
      >
        <p className="text-sm font-semibold text-gray-300 mb-1">📈 Statistical Insight</p>
        <p className={`text-sm ${
          comparison.isDifferentSignificant
            ? 'text-orange-300'
            : 'text-green-300'
        }`}>
          {comparison.isDifferentSignificant
            ? '⚠️ Segments show significant differences (>10% variance)'
            : '✅ Segments are relatively similar'}
        </p>
      </div>
    </div>
  );
}
