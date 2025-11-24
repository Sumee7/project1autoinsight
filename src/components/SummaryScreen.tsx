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
  const scoreColor = qualityScore === 'A' ? 'green' : qualityScore === 'B' ? 'blue' : 'yellow';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-${scoreColor}-100 rounded-full mb-4`}>
            <Award className={`w-10 h-10 text-${scoreColor}-600`} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analysis Complete!</h1>
          <p className="text-lg text-gray-600">Your data has been successfully analyzed and cleaned</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Overall Data Quality Score</h2>
            <div className={`inline-block text-6xl font-bold text-${scoreColor}-600 bg-${scoreColor}-50 px-8 py-4 rounded-2xl`}>
              {qualityScore}
            </div>
            <p className="text-sm text-gray-600 mt-2">Excellent data quality</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Cleaned Rows</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{rowsCleaned}</p>
              <p className="text-sm text-gray-600">rows removed or corrected</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Columns Affected</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{columnsAffected}</p>
              <p className="text-sm text-gray-600">columns cleaned</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Insights Generated</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{insightsGenerated}</p>
              <p className="text-sm text-gray-600">actionable insights</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Summary</h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p>All missing values have been handled using appropriate imputation methods</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Invalid data types have been corrected and standardized</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Statistical outliers have been identified and documented</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Duplicate records have been removed from the dataset</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Export Cleaned Data
          </button>
          <button
            onClick={onStartNew}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-4 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Analysis
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Thank you for using AutoInsight! Your cleaned data is ready for further analysis.
        </p>
      </div>
    </div>
  );
}
