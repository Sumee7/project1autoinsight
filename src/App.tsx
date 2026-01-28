import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import UploadScreen from "./components/UploadScreen";
import CleaningScreen from "./components/CleaningScreen";
import VisualizationScreen from "./components/VisualizationScreen";
import SummaryScreen from "./components/SummaryScreen";
import type { CleaningIssues, DataSummary, Statistics, Screen } from "./types";
import { analyzeCsvFile } from "./utils/csvAnalysis";
import { generateMockRows } from "./utils/mockData";

type DataRow = Record<string, string | number | null | undefined>;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [cleaningIssues, setCleaningIssues] = useState<CleaningIssues | null>(null);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [cleanedRows, setCleanedRows] = useState<DataRow[]>([]);
  const [error, setError] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const { dataSummary: summary, cleaningIssues, rows: parsedRows } = await analyzeCsvFile(selectedFile);
      setDataSummary(summary);
      setCleaningIssues(cleaningIssues);
      setRows(parsedRows as DataRow[]);
      setCleanedRows(parsedRows as DataRow[]);
      setCurrentScreen("cleaning");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze file. Please try another file.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = async () => {
    setIsAnalyzing(true);
    setError("");
    
    try {
      const mockRows = generateMockRows();
      const csvContent = [
        Object.keys(mockRows[0]).join(","),
        ...mockRows.map(row =>
          Object.values(row)
            .map(v => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], "sample-data.csv", { type: "text/csv" });
      
      setSelectedFile(file);
      
      const { dataSummary: summary, cleaningIssues, rows: parsedRows } = await analyzeCsvFile(file);
      setDataSummary(summary);
      setCleaningIssues(cleaningIssues);
      setRows(parsedRows as DataRow[]);
      setCleanedRows(parsedRows as DataRow[]);
      setCurrentScreen("cleaning");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sample data");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClean = (type: "auto" | "missing" | "invalid") => {
    if (!dataSummary || !cleaningIssues) return;

    const cleaned = cleanData(cleanedRows, type, dataSummary);
    setCleanedRows(cleaned);

    // Recalculate issues
    const newCleaningIssues = calculateCleaningIssues(cleaned, dataSummary.columnDetails);
    setCleaningIssues(newCleaningIssues);
  };

  const handleExport = () => {
    if (cleanedRows.length === 0) return;

    const headers = Object.keys(cleanedRows[0]);
    const csvContent = [
      headers.join(","),
      ...cleanedRows.map(row =>
        headers
          .map(h => {
            const v = row[h];
            const str = String(v ?? "");
            return str.includes(",") ? `"${str}"` : str;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleaned-data-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateStatistics = (): Statistics => {
    const numericColumns = dataSummary?.columnDetails.filter(col => col.type === "number") || [];
    if (numericColumns.length === 0 || cleanedRows.length === 0) {
      return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
    }

    const firstNumCol = numericColumns[0];
    const values = cleanedRows
      .map(row => {
        const v = row[firstNumCol.name];
        const n = typeof v === "number" ? v : Number(v);
        return Number.isFinite(n) ? n : null;
      })
      .filter((v): v is number => v !== null);

    if (values.length === 0) return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const stdDev = Math.sqrt(values.reduce((sq, n) => sq + (n - mean) ** 2) / values.length);

    return { mean, median, min, max, stdDev };
  };

  if (!isLoggedIn) {
    return <LoginScreen onSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg max-w-md">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {currentScreen === "upload" && (
        <UploadScreen
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onAnalyze={handleAnalyze}
          onLoadSample={handleLoadSample}
          isAnalyzing={isAnalyzing}
        />
      )}

      {currentScreen === "cleaning" && dataSummary && cleaningIssues && (
        <CleaningScreen
          dataSummary={dataSummary}
          cleaningIssues={cleaningIssues}
          onClean={handleClean}
          onNext={() => setCurrentScreen("visualization")}
          rows={cleanedRows}
        />
      )}

      {currentScreen === "visualization" && (
        <>
          {dataSummary && cleanedRows.length > 0 && (
            <VisualizationScreen
              statistics={calculateStatistics()}
              onNext={() => setCurrentScreen("summary")}
              rows={cleanedRows}
              dataSummary={dataSummary}
              cleaningIssues={cleaningIssues}
            />
          )}

          {(!dataSummary || cleanedRows.length === 0) && (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-4">No Data Available</h1>
                <p className="text-gray-400 mb-4">
                  {!dataSummary ? "Data summary is missing. " : ""}
                  {cleanedRows.length === 0 ? "No rows found. " : ""}
                  Please go back and try again.
                </p>
                <button
                  onClick={() => {
                    setCurrentScreen("cleaning");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition"
                >
                  ← Go Back to Cleaning
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {currentScreen === "summary" && (
        <SummaryScreen
          rowsCleaned={rows.length - cleanedRows.length}
          columnsAffected={dataSummary?.columns ?? 0}
          insightsGenerated={8}
          onExport={handleExport}
          onStartNew={() => {
            setCurrentScreen("upload");
            setSelectedFile(null);
            setDataSummary(null);
            setCleaningIssues(null);
            setRows([]);
            setCleanedRows([]);
          }}
        />
      )}
    </div>
  );
}

// Helper functions
function cleanData(rows: DataRow[], type: "auto" | "missing" | "invalid", summary: DataSummary): DataRow[] {
  let cleaned = [...rows];

  if (type === "auto" || type === "missing") {
    // Impute missing values
    cleaned = cleaned.map(row => {
      const newRow = { ...row };
      for (const col of summary.columnDetails) {
        if (newRow[col.name] === null || newRow[col.name] === "" || newRow[col.name] === undefined) {
          if (col.type === "number") {
            newRow[col.name] = 0;
          } else if (col.type === "date") {
            newRow[col.name] = new Date().toISOString().split("T")[0];
          } else {
            newRow[col.name] = "Unknown";
          }
        }
      }
      return newRow;
    });
  }

  if (type === "auto" || type === "invalid") {
    // Fix invalid types
    cleaned = cleaned.map(row => {
      const newRow = { ...row };
      for (const col of summary.columnDetails) {
        const val = newRow[col.name];
        if (col.type === "number" && typeof val !== "number") {
          newRow[col.name] = Number(val) || 0;
        } else if (col.type === "date" && typeof val !== "string") {
          newRow[col.name] = new Date(val as any).toISOString().split("T")[0];
        }
      }
      return newRow;
    });
  }

  if (type === "auto") {
    // Remove duplicates
    const seen = new Set<string>();
    cleaned = cleaned.filter(row => {
      const sig = Object.values(row).join("||");
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }

  return cleaned;
}

function calculateCleaningIssues(rows: DataRow[], columnDetails: DataSummary["columnDetails"]): CleaningIssues {
  const missingValues = columnDetails.filter(col => {
    const missing = rows.filter(r => r[col.name] === null || r[col.name] === "" || r[col.name] === undefined).length;
    return missing > 0;
  });

  const invalidTypes = columnDetails.filter(col => {
    let invalid = 0;
    for (const row of rows) {
      const val = row[col.name];
      if (col.type === "number" && typeof val !== "number" && val !== null && val !== "") {
        if (Number.isNaN(Number(val))) invalid++;
      }
    }
    return invalid > 0;
  });

  const duplicates = (() => {
    const seen = new Set<string>();
    let count = 0;
    for (const row of rows) {
      const sig = Object.values(row).join("||");
      if (seen.has(sig)) count++;
      else seen.add(sig);
    }
    return count;
  })();

  return { missingValues, invalidTypes, outliers: [], duplicates };
}
