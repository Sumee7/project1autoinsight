import { Upload, FileSpreadsheet } from 'lucide-react';

interface UploadScreenProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onAnalyze: () => void;
}

export default function UploadScreen({ onFileSelect, selectedFile, onAnalyze }: UploadScreenProps) {
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

  const loadSampleData = () => {
    const sampleFile = new File([''], 'sample-sales.csv', { type: 'text/csv' });
    onFileSelect(sampleFile);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AutoInsight</h1>
          <p className="text-lg text-gray-600">Upload your CSV file to start analyzing</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Upload your CSV file
          </h2>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group"
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-gray-500">Supports CSV files up to 100MB</p>
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={onAnalyze}
              disabled={!selectedFile}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
            >
              Analyze Data
            </button>

            <button
              onClick={loadSampleData}
              className="w-full bg-white text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Use sample dataset
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Your data is processed locally and never stored on our servers
        </p>
      </div>
    </div>
  );
}
