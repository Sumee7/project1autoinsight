/**
 * Visual Query Builder
 * Enables building queries without writing SQL
 */

import type { DataRow } from '../types';

export type FilterOperator = 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in' | 'isEmpty' | 'isNotEmpty';

export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: string | number | [number, number] | string[];
}

export interface QuerySelect {
  columns: string[];
}

export interface QueryGroupBy {
  column: string;
  aggregations: Array<{
    column: string;
    type: 'sum' | 'avg' | 'count' | 'min' | 'max';
  }>;
}

export interface QueryOrder {
  column: string;
  direction: 'asc' | 'desc';
}

export interface QueryConfig {
  select?: QuerySelect;
  filters?: QueryFilter[];
  groupBy?: QueryGroupBy;
  orderBy?: QueryOrder;
  limit?: number;
}

export interface ExecutionResult {
  results: DataRow[];
  rowCount: number;
  sql: string;
  executionTime: number;
}

/**
 * Build and execute a visual query
 */
export function executeQuery(data: DataRow[], config: QueryConfig): ExecutionResult {
  const startTime = Date.now();

  let results = [...data];

  // Apply filters
  if (config.filters && config.filters.length > 0) {
    results = applyFilters(results, config.filters);
  }

  // Apply groupBy (aggregation)
  if (config.groupBy) {
    results = applyGroupBy(results, config.groupBy);
  }

  // Apply column selection (only include specified columns)
  if (config.select && config.select.columns.length > 0) {
    results = results.map((row) => {
      const selectedRow: DataRow = {};
      config.select!.columns.forEach((col) => {
        selectedRow[col] = row[col];
      });
      return selectedRow;
    });
  }

  // Apply ordering
  if (config.orderBy) {
    results = applyOrderBy(results, config.orderBy);
  }

  // Apply limit
  if (config.limit) {
    results = results.slice(0, config.limit);
  }

  const executionTime = Date.now() - startTime;
  const sql = generateSQL(config);

  return {
    results,
    rowCount: results.length,
    sql,
    executionTime,
  };
}

/**
 * Apply filters to data
 */
function applyFilters(data: DataRow[], filters: QueryFilter[]): DataRow[] {
  return data.filter((row) => {
    return filters.every((filter) => {
      const value = row[filter.column];

      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'greater':
          return Number(value) > Number(filter.value);
        case 'less':
          return Number(value) < Number(filter.value);
        case 'between': {
          const [min, max] = filter.value as [number, number];
          return Number(value) >= min && Number(value) <= max;
        }
        case 'in': {
          const values = filter.value as string[];
          return values.includes(String(value));
        }
        case 'isEmpty':
          return value === null || value === undefined || value === '';
        case 'isNotEmpty':
          return value !== null && value !== undefined && value !== '';
        default:
          return true;
      }
    });
  });
}

/**
 * Apply groupBy and aggregations
 */
function applyGroupBy(data: DataRow[], config: QueryGroupBy): DataRow[] {
  const groups = new Map<string, DataRow[]>();

  // Group data
  data.forEach((row) => {
    const key = String(row[config.column]);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  });

  // Apply aggregations
  const results: DataRow[] = [];
  groups.forEach((groupData, groupKey) => {
    const aggregatedRow: DataRow = {
      [config.column]: groupKey,
    };

    config.aggregations.forEach(({ column, type }) => {
      const values = groupData
        .map((row) => row[column])
        .filter((val) => typeof val === 'number') as number[];

      const aggregationKey = `${column}_${type}`;

      switch (type) {
        case 'sum':
          aggregatedRow[aggregationKey] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregatedRow[aggregationKey] =
            values.length > 0
              ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
              : 0;
          break;
        case 'count':
          aggregatedRow[aggregationKey] = values.length;
          break;
        case 'min':
          aggregatedRow[aggregationKey] = values.length > 0 ? Math.min(...values) : null;
          break;
        case 'max':
          aggregatedRow[aggregationKey] = values.length > 0 ? Math.max(...values) : null;
          break;
      }
    });

    results.push(aggregatedRow);
  });

  return results;
}

/**
 * Apply ordering
 */
function applyOrderBy(data: DataRow[], config: QueryOrder): DataRow[] {
  return [...data].sort((a, b) => {
    const aVal = a[config.column];
    const bVal = b[config.column];

    let comparison = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return config.direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Generate SQL representation of query
 */
function generateSQL(config: QueryConfig): string {
  let sql = 'SELECT ';

  // SELECT clause
  if (config.select && config.select.columns.length > 0) {
    sql += config.select.columns.join(', ');
  } else {
    sql += '*';
  }

  sql += ' FROM data';

  // WHERE clause
  if (config.filters && config.filters.length > 0) {
    const whereClauses = config.filters.map((f) => generateFilterSQL(f)).join(' AND ');
    sql += ` WHERE ${whereClauses}`;
  }

  // GROUP BY clause
  if (config.groupBy) {
    sql += ` GROUP BY ${config.groupBy.column}`;
    const aggregations = config.groupBy.aggregations
      .map((a) => `${a.type.toUpperCase()}(${a.column})`)
      .join(', ');
    sql = `SELECT ${config.groupBy.column}, ${aggregations} FROM data`;
    if (config.filters && config.filters.length > 0) {
      const whereClauses = config.filters.map((f) => generateFilterSQL(f)).join(' AND ');
      sql += ` WHERE ${whereClauses}`;
    }
    sql += ` GROUP BY ${config.groupBy.column}`;
  }

  // ORDER BY clause
  if (config.orderBy) {
    sql += ` ORDER BY ${config.orderBy.column} ${config.orderBy.direction.toUpperCase()}`;
  }

  // LIMIT clause
  if (config.limit) {
    sql += ` LIMIT ${config.limit}`;
  }

  return sql;
}

/**
 * Generate SQL for a single filter
 */
function generateFilterSQL(filter: QueryFilter): string {
  const col = filter.column;

  switch (filter.operator) {
    case 'equals':
      return `${col} = '${filter.value}'`;
    case 'contains':
      return `${col} LIKE '%${filter.value}%'`;
    case 'greater':
      return `${col} > ${filter.value}`;
    case 'less':
      return `${col} < ${filter.value}`;
    case 'between': {
      const [min, max] = filter.value as [number, number];
      return `${col} BETWEEN ${min} AND ${max}`;
    }
    case 'in': {
      const values = (filter.value as string[]).map((v) => `'${v}'`).join(', ');
      return `${col} IN (${values})`;
    }
    case 'isEmpty':
      return `${col} IS NULL OR ${col} = ''`;
    case 'isNotEmpty':
      return `${col} IS NOT NULL AND ${col} != ''`;
    default:
      return '';
  }
}

/**
 * Suggest queries based on data patterns
 */
export function suggestQueries(data: DataRow[]): QueryConfig[] {
  const suggestions: QueryConfig[] = [];

  if (data.length === 0) return suggestions;

  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter((col) =>
    data.some((row) => typeof row[col] === 'number')
  );
  const stringColumns = columns.filter((col) =>
    data.some((row) => typeof row[col] === 'string')
  );

  // Suggestion 1: Top N by numeric column
  if (numericColumns.length > 0) {
    suggestions.push({
      select: { columns },
      orderBy: { column: numericColumns[0], direction: 'desc' },
      limit: 10,
    });
  }

  // Suggestion 2: Group by first string column with aggregation
  if (stringColumns.length > 0 && numericColumns.length > 0) {
    suggestions.push({
      groupBy: {
        column: stringColumns[0],
        aggregations: [
          { column: numericColumns[0], type: 'sum' },
          { column: numericColumns[0], type: 'avg' },
        ],
      },
      orderBy: { column: `${numericColumns[0]}_sum`, direction: 'desc' },
    });
  }

  // Suggestion 3: Count by category
  if (stringColumns.length > 0) {
    suggestions.push({
      groupBy: {
        column: stringColumns[0],
        aggregations: [{ column: columns[0], type: 'count' }],
      },
      orderBy: { column: `${columns[0]}_count`, direction: 'desc' },
    });
  }

  return suggestions;
}

/**
 * Create a basic filter for quick analysis
 */
export function createQuickFilter(
  column: string,
  operator: FilterOperator,
  value: any
): QueryFilter {
  return { column, operator, value };
}

/**
 * Build a filter from user input
 */
export function buildFilterFromInput(
  column: string,
  operator: FilterOperator,
  userValue: string
): QueryFilter {
  let value: any = userValue;

  if (operator === 'greater' || operator === 'less') {
    value = Number(userValue);
  } else if (operator === 'between') {
    const [min, max] = userValue.split('-').map((v) => Number(v.trim()));
    value = [min, max];
  } else if (operator === 'in') {
    value = userValue.split(',').map((v) => v.trim());
  }

  return { column, operator, value };
}
