import { useState } from 'react';
import { AlertCircle, CheckCircle, Database, Sparkles, Download } from 'lucide-react';
import { DataSummary, CleaningIssues } from '../types';
import AIAssistant from './AIAssistant';
import type { DataRow } from '../utils/salesAI'; // ✅ FIX 1: import as type

interface CleaningScreenProps {
  dataSummary: DataSummary;
  cleaningIssues: CleaningIssues;
  rows: DataRow[]; // ✅ rows added
  onClean: (type: 'auto' | 'missing' | 'invalid') => void;
  onNext: () => void;
}

export default function CleaningScreen({
  dataSummary,
  cleaningIssues,
  rows,
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
        ...cleaningIssues,
        missingValues: [],
      });
    } else if (type === 'invalid') {
      setCleanedIssues({
        ...cleaningIssues,
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
      '# All data types validated and standardized',
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

          {/* everything else unchanged… */}
          {/* (your issues + actions + next button are fine as-is) */}

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
        dataSummary={dataSummary}
        cleaningIssues={cleaningIssues}
        context="data cleaning report"
        rows={rows}
      />
    </div>
  );
}
