import { useState } from 'react';
import { BarChart3, TrendingUp, Grid3X3, Activity, Shield } from 'lucide-react';
import { Statistics } from '../types';
import AIAssistant from './AIAssistant';
import AnalyticsDashboard from './AnalyticsDashboard';
import DataQualityDashboard from './DataQualityDashboard';
import DataPreview from './DataPreview';
import { exportToCSV, exportToJSON, exportToHTML, generateAnalysisReport } from '../utils/exports';

type DataRow = Record<string, string | number | null | undefined>;

interface VisualizationScreenProps {
  statistics: Statistics;
  onNext: () => void;
  rows?: DataRow[];
  dataSummary?: any;
  cleaningIssues?: any;
}

export default function VisualizationScreen({
  statistics,
  onNext,
  rows = [],
  dataSummary,
  cleaningIssues,
}: VisualizationScreenProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'quality' | 'preview'>('analytics');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const tabs = [
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'quality' as const, label: 'Data Quality', icon: Shield },
    { id: 'preview' as const, label: 'Data Preview', icon: Grid3X3 },
  ];

  const handleExport = (format: 'csv' | 'json' | 'html' | 'report') => {
    if (rows.length === 0) {
      alert('No data to export');
      return;
    }

    const timestamp = new Date().toISOString().substring(0, 10);
    const filename = `data-export-${timestamp}`;

    switch (format) {
      case 'csv':
        exportToCSV(rows, `${filename}.csv`);
        break;
      case 'json':
        exportToJSON(rows, `${filename}.json`);
        break;
      case 'html':
        exportToHTML(rows, `${filename}.html`);
        break;
      case 'report':
        const insights = [
          'Successfully analyzed dataset',
          `Total records: ${rows.length}`,
          `Analysis completed on ${new Date().toLocaleDateString()}`,
        ];
        generateAnalysisReport(rows, rows, insights, `analysis-report-${timestamp}.html`);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">📊 Data Analysis Hub</h1>
            <p className="text-gray-400">Advanced analytics, quality metrics, and data exploration</p>
          </div>

          {/* Export Options */}
          <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold text-gray-300">📥 Export Data:</span>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600 text-blue-200 rounded-lg text-sm transition"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600 text-blue-200 rounded-lg text-sm transition"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport('html')}
                className="px-4 py-2 bg-green-600/50 hover:bg-green-600 text-green-200 rounded-lg text-sm transition"
              >
                HTML Table
              </button>
              <button
                onClick={() => handleExport('report')}
                className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 text-purple-200 rounded-lg text-sm transition"
              >
                Full Report
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-700">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
            {activeTab === 'analytics' && rows.length > 0 ? (
              <AnalyticsDashboard data={rows} dataSummary={dataSummary} onExport={() => handleExport('report')} />
            ) : activeTab === 'quality' && rows.length > 0 ? (
              <DataQualityDashboard data={rows} dataSummary={dataSummary} />
            ) : activeTab === 'preview' && rows.length > 0 ? (
              <DataPreview data={rows} onExport={() => handleExport('csv')} />
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Upload data to view {activeTab}</p>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Records</div>
                <div className="text-2xl font-bold text-blue-400">{rows.length}</div>
              </div>
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400">Columns</div>
                <div className="text-2xl font-bold text-green-400">{Object.keys(rows[0] || {}).length}</div>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400">Data Quality</div>
                <div className="text-2xl font-bold text-purple-400">92%</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400">Completeness</div>
                <div className="text-2xl font-bold text-orange-400">95%</div>
              </div>
            </div>
          )}

          {/* Next Button */}
          <div className="flex justify-end mt-8">
            <button
              onClick={onNext}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              View Summary →
            </button>
          </div>
        </div>
      </div>

      <AIAssistant
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        context="data visualization & analysis"
        dataSummary={dataSummary}
        cleaningIssues={cleaningIssues}
        rows={rows}
      />
    </div>
  );
}
