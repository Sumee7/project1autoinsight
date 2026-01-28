import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import CleaningScreen from "./components/CleaningScreen";
import type { CleaningIssues, DataSummary } from "./types";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const dataSummary: DataSummary = {
    rows: 1213,
    columns: 8,
    duplicates: 34,
    columnDetails: [
      { name: "ID", type: "number" },
      { name: "Date", type: "date" },
      { name: "Customer Name", type: "string" },
      { name: "Product", type: "string" },
      { name: "Category", type: "string" },
      { name: "Score", type: "number" },
      { name: "Revenue", type: "number" },
      { name: "Status", type: "string" },
    ],
  };

  const cleaningIssues: CleaningIssues = {
    missingValues: [],
    invalidTypes: [],
    outliers: [],
    duplicates: 34,
  };

  if (!isLoggedIn) {
    return <LoginScreen onSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <CleaningScreen
      dataSummary={dataSummary}
      cleaningIssues={cleaningIssues}
      onClean={() => {}}
      onNext={() => {}}
    />
  );
}
