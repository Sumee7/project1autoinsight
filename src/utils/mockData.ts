import { DataSummary, CleaningIssues, Statistics } from '../types';

export function generateMockDataSummary(): DataSummary {
  return {
    rows: 1247,
    columns: 8,
    columnDetails: [
      { name: 'ID', type: 'number', missing: 0, invalid: 0 },
      { name: 'Date', type: 'date', missing: 12, invalid: 5 },
      { name: 'Customer Name', type: 'string', missing: 8, invalid: 0 },
      { name: 'Product', type: 'string', missing: 15, invalid: 2 },
      { name: 'Category', type: 'string', missing: 4, invalid: 0 },
      { name: 'Score', type: 'number', missing: 23, invalid: 7, outliers: 14 },
      { name: 'Revenue', type: 'number', missing: 18, invalid: 6, outliers: 9 },
      { name: 'Status', type: 'string', missing: 6, invalid: 3 },
    ],
    duplicates: 34,
  };
}

export function generateCleaningIssues(dataSummary: DataSummary): CleaningIssues {
  return {
    missingValues: dataSummary.columnDetails.filter((col) => col.missing > 0),
    invalidTypes: dataSummary.columnDetails.filter((col) => col.invalid > 0),
    outliers: dataSummary.columnDetails.filter((col) => col.outliers && col.outliers > 0),
    duplicates: dataSummary.duplicates,
  };
}

export function generateStatistics(): Statistics {
  return {
    mean: 78.45,
    median: 76.32,
    min: 12.5,
    max: 156.8,
    stdDev: 22.67,
  };
}
// Add this to src/utils/mockData.ts
export function generateMockRows() {
  return [
    { "Customer Name": "Mike Smith", Product: "Laptop", Category: "Electronics", Date: "2025-01-05", Revenue: 1200, Quantity: 1, Status: "Paid", Region: "Sydney" },
    { "Customer Name": "John Doe", Product: "Mouse", Category: "Electronics", Date: "2025-01-06", Revenue: 25, Quantity: 2, Status: "Paid", Region: "Melbourne" },
    { "Customer Name": "Mike Brown", Product: "Chair", Category: "Furniture", Date: "2025-01-06", Revenue: 180, Quantity: 1, Status: "Pending", Region: "Sydney" },
    { "Customer Name": "Sara Lee", Product: "Desk", Category: "Furniture", Date: "2025-01-07", Revenue: 350, Quantity: 1, Status: "Paid", Region: "Brisbane" },
    { "Customer Name": "Mike Smith", Product: "Laptop", Category: "Electronics", Date: "2025-01-05", Revenue: 1200, Quantity: 1, Status: "Paid", Region: "Sydney" }, // duplicate on purpose
    { "Customer Name": "", Product: "Keyboard", Category: "Electronics", Date: "2025-01-08", Revenue: 80, Quantity: 1, Status: "Paid", Region: "Perth" }, // missing name
    { "Customer Name": "Emily Stone", Product: "Headphones", Category: "Electronics", Date: "2025-01-08", Revenue: null, Quantity: 1, Status: "Paid", Region: "Sydney" }, // missing revenue
  ];
}
