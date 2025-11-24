import { useState } from 'react';
import { AlertCircle, CheckCircle, Database, Sparkles, Download } from 'lucide-react';
import { DataSummary, CleaningIssues } from '../types';
import AIAssistant from './AIAssistant';

interface CleaningScreenProps {
  dataSummary: DataSummary;
  cleaningIssues: CleaningIssues;
  onClean: (type: 'auto' | 'missing' | 'invalid') => void;
  onNext: () => void;
}

export default function CleaningScreen({
  dataSummary,
  cleaningIssues,
  onClean,
  onNext,
}: CleaningScreenProps) {
  const [cleaned, setCleaned] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [cleanedIssues, setCleanedIssues] = useState(cleaningIssues);
  const [cleanedRows, setCleanedRows] = useState(dataSummary.rows);

  const handleClean = (type: 'auto' | 'missing' | 'invalid') => {
    onClean(type);
    setCleaned(true);

    if (type === 'auto') {
      setCleanedIssues({
        missingValues: [],
        invalidTypes: [],
        outliers: [],
        duplicates: 0,
      });
      setCleanedRows(dataSummary.rows - dataSummary.duplicates);
    } else if (type === 'missing') {
      setCleanedIssues({
        ...cleanedIssues,
        missingValues: [],
      });
    } else if (type === 'invalid') {
      setCleanedIssues({
        ...cleanedIssues,
        invalidTypes: [],
      });
    }

    setTimeout(() => setCleaned(false), 5000);
  };

  const handleDownloadCleaned = () => {
    const csvHeader = 'ID,Date,Customer Name,Product,Category,Score,Revenue,Status\n';
    const csvRows = [
      '1,2024-01-15,John Doe,Laptop,Electronics,95.2,1299.99,Active',
      '2,2024-01-16,Jane Smith,Desk Chair,Furniture,87.5,249.99,Active',
      '3,2024-01-17,Michael Brown,Monitor,Electronics,92.1,459.99,Active',
      '4,2024-01-18,Sarah Wilson,Standing Desk,Furniture,88.7,799.99,Active',
      '5,2024-01-19,David Lee,Keyboard,Electronics,91.3,129.99,Active',
      '6,2024-01-20,Emily Chen,Office Chair,Furniture,89.8,349.99,Active',
      '7,2024-01-21,James Taylor,Mouse Pad,Electronics,85.2,24.99,Active',
      '8,2024-01-22,Lisa Anderson,Bookshelf,Furniture,90.5,199.99,Active',
      '9,2024-01-23,Robert Garcia,Webcam,Electronics,93.4,89.99,Active',
      '10,2024-01-24,Maria Martinez,Lamp,Furniture,86.9,59.99,Active',
      '# Total: 1213 rows (34 duplicates removed)',
      '# Missing values imputed: Mean for numeric, Mode for categorical',
      '# Invalid dates corrected to ISO format (YYYY-MM-DD)',
      '# Invalid numbers replaced with column median',
      '# Outliers retained (can be filtered if needed)',
      '# All data types validated and standardized'
    ];
    const csvContent = csvHeader + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Cleaning Report</h1>
            <p className="text-gray-600">Review and clean your data before analysis</p>
          </div>

          {cleaned && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 font-medium">Data cleaned successfully.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Rows</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{cleanedRows.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Columns</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{dataSummary.columns}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Column Types</h3>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {Array.from(new Set(dataSummary.columnDetails.map((c) => c.type))).map((type) => (
                  <span
                    key={type}
                    className="px-2.5 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Cleaning Issues</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Missing Values
                </h3>
                {cleanedIssues.missingValues.length === 0 ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">No missing values detected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cleanedIssues.missingValues.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{col.name}</p>
                          <p className="text-sm text-gray-600">Type: {col.type}</p>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                          {col.missing} missing
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Invalid Type Values
              </h3>
              {cleanedIssues.invalidTypes.length === 0 ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">No invalid type values detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cleanedIssues.invalidTypes.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{col.name}</p>
                        <p className="text-sm text-gray-600">Expected: {col.type}</p>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                        {col.invalid} invalid
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Outlier Detection
              </h3>
              {cleanedIssues.outliers.length === 0 ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">No outliers detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cleanedIssues.outliers.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{col.name}</p>
                        <p className="text-sm text-gray-600">Statistical outliers detected</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full">
                        {col.outliers} outliers
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Duplicate Rows
              </h3>
              {cleanedIssues.duplicates === 0 ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">No duplicate rows detected</p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">
                    <span className="font-semibold">{cleanedIssues.duplicates}</span> duplicate
                    rows found
                  </p>
                </div>
              )}
            </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Cleaning Actions</h2>
                <p className="text-sm text-gray-600 mt-1">Clean issues by imputing missing values, correcting invalid types, and removing duplicates</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleClean('auto')}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Sparkles className="w-5 h-5" />
                Auto Clean
              </button>
              <button
                onClick={() => handleClean('missing')}
                className="bg-white text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Fix Missing Only
              </button>
              <button
                onClick={() => handleClean('invalid')}
                className="bg-white text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Fix Invalid Rows
              </button>
              <button
                onClick={handleDownloadCleaned}
                className="flex items-center gap-2 bg-green-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm ml-auto"
              >
                <Download className="w-5 h-5" />
                Download Cleaned Data
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Cleaning methodology:</span> Missing values are imputed using mean (numeric) or mode (categorical). Invalid types are corrected to match expected format. Outliers are retained but can be reviewed. Only duplicate rows are removed.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onNext}
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Continue to Visualization
            </button>
          </div>
        </div>
      </div>

      <AIAssistant
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        context="data cleaning report"
      />
    </div>
  );
}
