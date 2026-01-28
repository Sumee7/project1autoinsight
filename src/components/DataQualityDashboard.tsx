import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { DataRow, DataSummary } from '../types';
import { generateQualityReport, generateColumnProfiles } from '../utils/dataQuality';

interface DataQualityDashboardProps {
  data: DataRow[];
  dataSummary?: DataSummary;
}

export default function DataQualityDashboard({
  data,
  dataSummary,
}: DataQualityDashboardProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Upload data to view quality metrics
      </div>
    );
  }

  const qualityReport = generateQualityReport(data, dataSummary);
  const columnProfiles = generateColumnProfiles(data);

  // Prepare data for quality score chart
  const scoreData = [
    { name: 'Completeness', value: qualityReport.completeness },
    { name: 'Uniqueness', value: qualityReport.uniqueness },
    { name: 'Validity', value: qualityReport.validity },
    { name: 'Consistency', value: qualityReport.consistency },
  ];

  // Prepare data for column quality
  const columnQualityData = columnProfiles.map((col) => ({
    name: col.name.substring(0, 12),
    completeness: 100 - col.missingRate,
    uniqueness: col.cardinalityRatio,
  }));

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-2">Overall Quality Score</div>
              <div className="text-4xl font-bold text-blue-400">{qualityReport.overallScore}%</div>
            </div>
            {qualityReport.overallScore >= 80 ? (
              <CheckCircle className="w-12 h-12 text-green-400" />
            ) : qualityReport.overallScore >= 60 ? (
              <AlertCircle className="w-12 h-12 text-yellow-400" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-400" />
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Total Records</div>
          <div className="text-4xl font-bold text-green-400">{data.length.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Columns</div>
          <div className="text-4xl font-bold text-purple-400">{Object.keys(data[0] || {}).length}</div>
        </div>
      </div>

      {/* Quality Dimensions Chart */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Quality Dimensions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Issues & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issues */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Issues Found</h3>
          </div>
          {qualityReport.issues.length === 0 ? (
            <div className="text-gray-400 text-sm">✓ No major issues detected</div>
          ) : (
            <ul className="space-y-2">
              {qualityReport.issues.map((issue, idx) => (
                <li key={idx} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-red-400 flex-shrink-0">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {qualityReport.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-300 flex gap-2">
                <span className="text-green-400 flex-shrink-0">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Column Quality Details */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🔍 Column Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-2 text-left text-blue-300">Column</th>
                <th className="px-4 py-2 text-left text-blue-300">Type</th>
                <th className="px-4 py-2 text-right text-blue-300">Non-Null</th>
                <th className="px-4 py-2 text-right text-blue-300">Missing %</th>
                <th className="px-4 py-2 text-right text-blue-300">Unique</th>
              </tr>
            </thead>
            <tbody>
              {columnProfiles.slice(0, 10).map((col) => (
                <tr key={col.name} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                  <td className="px-4 py-2 font-medium text-white">{col.name}</td>
                  <td className="px-4 py-2 text-gray-400">{col.type}</td>
                  <td className="px-4 py-2 text-right text-gray-400">{col.nonNull}</td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        col.missingRate === 0
                          ? 'bg-green-900/30 text-green-400'
                          : col.missingRate < 5
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      {col.missingRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-400">{col.unique}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
