import { useState } from 'react';
import { ChevronUp, ChevronDown, Download, Filter } from 'lucide-react';
import type { DataRow } from '../types';

interface DataPreviewProps {
  data: DataRow[];
  onExport?: () => void;
  maxRows?: number;
}

export default function DataPreview({
  data,
  onExport,
}: DataPreviewProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No data to display
      </div>
    );
  }

  const headers = Object.keys(data[0] || {});
  const itemsPerPage = 10;

  // Filter data
  let filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // Sort data
  if (sortColumn) {
    filteredData = [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aNum = Number(aVal);
      const bNum = Number(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const displayData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter data..."
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 text-white rounded-lg text-sm"
        />
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 border-b border-gray-700">
              {headers.map((header) => (
                <th
                  key={header}
                  onClick={() => toggleSort(header)}
                  className="px-4 py-3 text-left font-semibold text-blue-300 cursor-pointer hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-2">
                    {header}
                    {sortColumn === header &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-700 hover:bg-gray-800/30"
              >
                {headers.map((header) => (
                  <td
                    key={`${idx}-${header}`}
                    className="px-4 py-3 text-gray-300 truncate max-w-xs"
                    title={String(row[header])}
                  >
                    {row[header] === null || row[header] === undefined
                      ? '-'
                      : String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <div>
          Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filteredData.length)} of{' '}
          {filteredData.length} rows
          {filterText && ` (filtered from ${data.length})`}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
