import { useState } from 'react';
import { Plus, Trash2, Play } from 'lucide-react';
import type { QueryFilter, QueryConfig, FilterOperator } from '../utils/queryBuilder';

interface QueryBuilderUIProps {
  columns: string[];
  onExecute?: (config: QueryConfig) => void;
  onGenerateSQL?: (sql: string) => void;
}

const FILTER_OPERATORS: FilterOperator[] = [
  'equals',
  'contains',
  'greater',
  'less',
  'between',
  'in',
  'isEmpty',
  'isNotEmpty',
];

export default function QueryBuilderUI({
  columns,
  onExecute,
  onGenerateSQL,
}: QueryBuilderUIProps) {
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns);
  const [orderByColumn, setOrderByColumn] = useState<string>(columns[0] || '');
  const [orderByDirection, setOrderByDirection] = useState<'asc' | 'desc'>('asc');
  const [limit, setLimit] = useState<number>(100);

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        column: columns[0] || '',
        operator: 'equals',
        value: '',
      },
    ]);
  };

  const removeFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const updateFilter = (idx: number, field: keyof QueryFilter, value: any) => {
    const newFilters = [...filters];
    (newFilters[idx] as any)[field] = value;
    setFilters(newFilters);
  };

  const executeQuery = () => {
    const config: QueryConfig = {
      select: { columns: selectedColumns },
      filters: filters.length > 0 ? filters : undefined,
      orderBy: orderByColumn ? { column: orderByColumn, direction: orderByDirection } : undefined,
      limit: limit > 0 ? limit : undefined,
    };

    if (onExecute) {
      onExecute(config);
    }

    // Generate SQL
    let sql = `SELECT ${selectedColumns.join(', ')} FROM data`;
    if (filters.length > 0) {
      const whereClauses = filters
        .map((f) => {
          if (f.operator === 'equals') return `${f.column} = '${f.value}'`;
          if (f.operator === 'contains') return `${f.column} LIKE '%${f.value}%'`;
          if (f.operator === 'greater') return `${f.column} > ${f.value}`;
          if (f.operator === 'less') return `${f.column} < ${f.value}`;
          return '';
        })
        .join(' AND ');
      sql += ` WHERE ${whereClauses}`;
    }
    if (orderByColumn) {
      sql += ` ORDER BY ${orderByColumn} ${orderByDirection.toUpperCase()}`;
    }
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    if (onGenerateSQL) {
      onGenerateSQL(sql);
    }
  };

  return (
    <div className="space-y-6">
      {/* Column Selection */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📋 Select Columns</h3>
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <button
              key={col}
              onClick={() => {
                if (selectedColumns.includes(col)) {
                  setSelectedColumns(selectedColumns.filter((c) => c !== col));
                } else {
                  setSelectedColumns([...selectedColumns, col]);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedColumns.includes(col)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
              }`}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">🔍 Filters</h3>
          <button
            onClick={addFilter}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600/50 hover:bg-indigo-600/70 text-indigo-200 text-xs font-semibold rounded transition-all"
          >
            <Plus className="w-4 h-4" /> Add Filter
          </button>
        </div>

        {filters.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No filters applied</p>
        ) : (
          <div className="space-y-2">
            {filters.map((filter, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-gray-700/20 p-2 rounded">
                <select
                  value={filter.column}
                  onChange={(e) => updateFilter(idx, 'column', e.target.value)}
                  className="flex-1 px-2 py-1 bg-gray-700/50 text-gray-200 text-xs rounded border border-gray-600/50"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(idx, 'operator', e.target.value as FilterOperator)}
                  className="flex-1 px-2 py-1 bg-gray-700/50 text-gray-200 text-xs rounded border border-gray-600/50"
                >
                  {FILTER_OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>

                {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                  <input
                    type="text"
                    value={String(filter.value)}
                    onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 bg-gray-700/50 text-gray-200 text-xs rounded border border-gray-600/50 placeholder-gray-600"
                  />
                )}

                <button
                  onClick={() => removeFilter(idx)}
                  className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sorting */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">↕️ Sort By</h3>
        <div className="flex gap-2">
          <select
            value={orderByColumn}
            onChange={(e) => setOrderByColumn(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700/50 text-gray-200 text-xs rounded border border-gray-600/50"
          >
            <option value="">Select column...</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>

          <select
            value={orderByDirection}
            onChange={(e) => setOrderByDirection(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2 bg-gray-700/50 text-gray-200 text-xs rounded border border-gray-600/50"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Limit */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📊 Limit Results</h3>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700/50 text-gray-200 text-xs rounded border border-gray-600/50"
          min="1"
          max="10000"
        />
      </div>

      {/* Execute Button */}
      <button
        onClick={executeQuery}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all font-semibold"
      >
        <Play className="w-5 h-5" /> Execute Query
      </button>
    </div>
  );
}
