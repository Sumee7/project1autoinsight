import { Award, Download, RotateCcw, CheckCircle, TrendingUp, FileSpreadsheet } from 'lucide-react';

interface SummaryScreenProps {
  rowsCleaned: number;
  columnsAffected: number;
  insightsGenerated: number;
  onExport: () => void;
  onStartNew: () => void;
}

export default function SummaryScreen({
  rowsCleaned,
  columnsAffected,
  insightsGenerated,
  onExport,
  onStartNew,
}: SummaryScreenProps) {
  const qualityScore = 'A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-green-600/20 rounded-full mb-4 border border-green-500/50`}>
            <Award className={`w-10 h-10 text-green-400`} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Analysis Complete!</h1>
          <p className="text-lg text-gray-300">Your data has been successfully analyzed and cleaned</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-8 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Overall Data Quality Score</h2>
            <div className={`inline-block text-6xl font-bold text-green-400 bg-green-600/20 px-8 py-4 rounded-2xl border border-green-500/50`}>
              {qualityScore}
            </div>
            <p className="text-sm text-gray-400 mt-2">Excellent data quality</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/20 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600/50 rounded-full flex items-center justify-center border border-blue-500/50">
                  <CheckCircle className="w-6 h-6 text-blue-300" />
                </div>
                <h3 className="font-semibold text-white">Cleaned Rows</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{rowsCleaned}</p>
              <p className="text-sm text-gray-400">rows removed or corrected</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/20 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-600/50 rounded-full flex items-center justify-center border border-purple-500/50">
                  <FileSpreadsheet className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white">Columns Affected</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{columnsAffected}</p>
              <p className="text-sm text-gray-400">columns cleaned</p>
            </div>

            <div className="bg-gradient-to-br from-green-600/30 to-green-700/20 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-600/50 rounded-full flex items-center justify-center border border-green-500/50">
                  <TrendingUp className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="font-semibold text-white">Insights Generated</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{insightsGenerated}</p>
              <p className="text-sm text-gray-400">actionable insights</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Analysis Summary</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p>All missing values have been handled using appropriate imputation methods</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p>Invalid data types have been corrected and standardized</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p>Statistical outliers have been identified and documented</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p>Duplicate records have been removed from the dataset</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export Cleaned Data
          </button>
          <button
            onClick={onStartNew}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-gray-100 font-semibold py-4 px-6 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Analysis
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Thank you for using AutoInsight! Your cleaned data is ready for further analysis.
        </p>
      </div>
    </div>
  );
}
