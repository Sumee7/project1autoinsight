import { Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { lineageTracker, type DataLineageHistory } from '../utils/dataLineage';

interface DataFreshnessProps {
  history: DataLineageHistory;
  onViewTimeline?: () => void;
}

export default function DataFreshness({ history, onViewTimeline }: DataFreshnessProps) {
  const freshness = getFreshnessInfo(history);
  const impact = history.events.filter(
    (e) => e.action !== 'uploaded'
  ).length;

  return (
    <div className="space-y-4">
      {/* Trust Score */}
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-gray-300">Data Trust Score</span>
          </div>
          <span className="text-3xl font-bold text-blue-400">{history.dataTrustScore}/100</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${history.dataTrustScore}%` }}
          ></div>
        </div>
      </div>

      {/* Freshness Status */}
      <div
        className={`border rounded-lg p-4 ${
          freshness.isFresh
            ? 'bg-green-900/20 border-green-500/30'
            : 'bg-yellow-900/20 border-yellow-500/30'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {freshness.isFresh ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-300">Data Age</span>
            </div>
            <p className="text-lg font-bold text-gray-200">{freshness.ageLabel}</p>
            <p className="text-xs text-gray-400 mt-1">{freshness.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Transformation Impact */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-300">Transformation Impact</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Original Rows:</span>
            <span className="text-gray-200 font-semibold">{history.originalRowCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Current Rows:</span>
            <span className="text-gray-200 font-semibold">{history.currentRowCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Data Loss:</span>
            <span className="text-orange-400 font-semibold">
              {calculateDataLoss(history.originalRowCount, history.currentRowCount)}%
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-700/30">
            <span className="text-gray-400">Transformations:</span>
            <span className="text-gray-200 font-semibold">{history.totalTransformations}</span>
          </div>
        </div>
      </div>

      {/* Timeline Button */}
      {onViewTimeline && (
        <button
          onClick={onViewTimeline}
          className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all text-sm font-semibold"
        >
          📋 View Full Lineage Timeline
        </button>
      )}
    </div>
  );
}

interface FreshnessInfo {
  ageLabel: string;
  recommendation: string;
  isFresh: boolean;
}

function getFreshnessInfo(history: DataLineageHistory): FreshnessInfo {
  const lastEvent = history.events[history.events.length - 1];
  if (!lastEvent) {
    return {
      ageLabel: 'Just now',
      recommendation: '✅ Data is very fresh',
      isFresh: true,
    };
  }

  const ageHours =
    (new Date().getTime() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60);

  if (ageHours < 1) {
    return {
      ageLabel: 'Just now',
      recommendation: '✅ Data is very fresh',
      isFresh: true,
    };
  } else if (ageHours < 24) {
    return {
      ageLabel: `${Math.floor(ageHours)}h ago`,
      recommendation: '✅ Data is fresh',
      isFresh: true,
    };
  } else if (ageHours < 168) {
    return {
      ageLabel: `${Math.floor(ageHours / 24)} days ago`,
      recommendation: '⚠️ Data is moderately aged',
      isFresh: false,
    };
  } else {
    return {
      ageLabel: `${Math.floor(ageHours / 168)} weeks ago`,
      recommendation: '⚠️ Consider refreshing data',
      isFresh: false,
    };
  }
}

function calculateDataLoss(original: number, current: number): number {
  if (original === 0) return 0;
  return Math.round(((original - current) / original) * 100);
}
