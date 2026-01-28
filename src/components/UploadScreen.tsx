import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';

interface UploadScreenProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onAnalyze: () => void;
  onLoadSample: () => void;
  isAnalyzing: boolean;
}

export default function UploadScreen({ onFileSelect, selectedFile, onAnalyze, onLoadSample, isAnalyzing }: UploadScreenProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4 border border-blue-400/30">
            <FileSpreadsheet className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AutoInsight</h1>
          <p className="text-lg text-gray-300">Intelligent Data Cleaning & Analysis Platform</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Upload your CSV file
          </h2>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-blue-500/50 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-500/5 transition-all cursor-pointer group"
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-blue-400/70 group-hover:text-blue-300 mx-auto mb-4 transition-colors" />
              <p className="text-lg font-medium text-white mb-2">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-gray-400">Supports CSV files up to 100MB</p>
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <p className="font-medium text-white">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={onAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Data"
              )}
            </button>

            <button
              onClick={onLoadSample}
              disabled={isAnalyzing}
              className="w-full bg-gray-700 text-gray-100 font-medium py-3 px-6 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Use Sample Dataset"
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Your data is processed locally and never stored on our servers
        </p>
      </div>
    </div>
  );
}
