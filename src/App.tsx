import { useState } from "react";

import LoginScreen from "./components/LoginScreen";
import UploadScreen from "./components/UploadScreen";
import CleaningScreen from "./components/CleaningScreen";
import VisualizationScreen from "./components/VisualizationScreen";

import { analyzeCsvFile } from "./utils/csvAnalysis";
import type { CleaningIssues, DataSummary, Statistics } from "./types";

type Step = "login" | "upload" | "cleaning" | "visualization";

const emptyStats: Statistics = {
  mean: 0,
  median: 0,
  min: 0,
  max: 0,
  stdDev: 0,
};

export default function App() {
  const [step, setStep] = useState<Step>("login");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [cleaningIssues, setCleaningIssues] = useState<CleaningIssues | null>(null);

  // VisualizationScreen bunu istiyor: Statistics
  const [statistics, setStatistics] = useState<Statistics>(emptyStats);

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      const result = await analyzeCsvFile(selectedFile);

      setDataSummary(result.dataSummary);
      setCleaningIssues(result.cleaningIssues);

      // csvAnalysis statistics döndürmüyorsa bile crash olmasın diye default set
      setStatistics((result as any).statistics ?? emptyStats);

      setStep("cleaning");
    } catch (err) {
      console.error(err);
      alert("CSV analysis failed. Please check the CSV format and try again.");
    }
  };

  const handleClean = (type: "auto" | "missing" | "invalid") => {
    // Şimdilik UI simülasyonu: İstersen gerçek temizleme de ekleriz.
    console.log("Clean:", type);

    if (!dataSummary || !cleaningIssues) return;

    if (type === "auto") {
      setCleaningIssues({
        missingValues: [],
        invalidTypes: [],
        outliers: [],
        duplicates: 0,
      });

      setDataSummary({
        ...dataSummary,
        rows: Math.max(0, dataSummary.rows - (dataSummary.duplicates ?? 0)),
        duplicates: 0,
      });
    }

    if (type === "missing") {
      setCleaningIssues({
        ...cleaningIssues,
        missingValues: [],
      });
    }

    if (type === "invalid") {
      setCleaningIssues({
        ...cleaningIssues,
        invalidTypes: [],
      });
    }
  };

  // ---------------- RENDER ----------------

  if (step === "login") {
    // ✅ LoginScreen prop ismi onSuccess
    return <LoginScreen onSuccess={() => setStep("upload")} />;
  }

  if (step === "upload") {
    return (
      <UploadScreen
        selectedFile={selectedFile}
        onFileSelect={(file) => setSelectedFile(file)}
        onAnalyze={handleAnalyze}
      />
    );
  }

  if (step === "cleaning") {
    if (!dataSummary || !cleaningIssues) {
      // güvenlik
      setStep("upload");
      return null;
    }

    return (
      <CleaningScreen
        dataSummary={dataSummary}
        cleaningIssues={cleaningIssues}
        onClean={handleClean}
        onNext={() => setStep("visualization")}
      />
    );
  }

  // visualization
  return (
    <VisualizationScreen
      statistics={statistics}
      onNext={() => {
        // Summary sayfan varsa buraya bağlarız
        alert("Summary screen is not connected yet. If you want, I can link it now.");
      }}
    />
  );
}
