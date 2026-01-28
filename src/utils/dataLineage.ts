/**
 * Data Lineage Tracking
 * Tracks transformations, audit trail, and data freshness
 */

export interface DataLineageEvent {
  id: string;
  timestamp: Date;
  action: 'uploaded' | 'filtered' | 'aggregated' | 'transformed' | 'exported';
  description: string;
  affectedRows: number;
  previousRowCount: number;
  rowCountChange: number;
  details: Record<string, unknown>;
}

export interface DataLineageHistory {
  uploadTime: Date;
  lastModified: Date;
  events: DataLineageEvent[];
  totalTransformations: number;
  currentRowCount: number;
  originalRowCount: number;
  dataTrustScore: number;
}

class LineageTracker {
  private events: DataLineageEvent[] = [];
  private uploadTime: Date = new Date();
  private originalRowCount: number = 0;
  private currentRowCount: number = 0;

  /**
   * Initialize tracker with upload event
   */
  initialize(rowCount: number, fileName: string): void {
    this.uploadTime = new Date();
    this.originalRowCount = rowCount;
    this.currentRowCount = rowCount;

    this.recordEvent({
      action: 'uploaded',
      description: `Uploaded file: ${fileName}`,
      affectedRows: rowCount,
      previousRowCount: 0,
      details: { fileName },
    });
  }

  /**
   * Record a transformation event
   */
  recordEvent(event: Omit<DataLineageEvent, 'id' | 'timestamp' | 'rowCountChange'>): void {
    const rowCountChange = event.affectedRows - event.previousRowCount;
    this.currentRowCount = event.affectedRows;

    const lineageEvent: DataLineageEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event,
      rowCountChange,
    };

    this.events.push(lineageEvent);
  }

  /**
   * Record a filter operation
   */
  recordFilter(
    filterDescription: string,
    previousCount: number,
    newCount: number,
    filterDetails: Record<string, unknown>
  ): void {
    this.recordEvent({
      action: 'filtered',
      description: filterDescription,
      affectedRows: newCount,
      previousRowCount: previousCount,
      details: filterDetails,
    });
  }

  /**
   * Record an aggregation/grouping operation
   */
  recordAggregation(
    groupColumn: string,
    aggregationType: string,
    resultRowCount: number,
    previousCount: number
  ): void {
    this.recordEvent({
      action: 'aggregated',
      description: `Aggregated by ${groupColumn} using ${aggregationType}`,
      affectedRows: resultRowCount,
      previousRowCount: previousCount,
      details: { groupColumn, aggregationType },
    });
  }

  /**
   * Record a data transformation
   */
  recordTransformation(
    description: string,
    affectedRows: number,
    previousCount: number,
    details: Record<string, unknown>
  ): void {
    this.recordEvent({
      action: 'transformed',
      description,
      affectedRows,
      previousRowCount: previousCount,
      details,
    });
  }

  /**
   * Record an export operation
   */
  recordExport(format: string, rowCount: number): void {
    this.recordEvent({
      action: 'exported',
      description: `Exported ${rowCount} rows to ${format.toUpperCase()}`,
      affectedRows: rowCount,
      previousRowCount: rowCount,
      details: { format, rowCount },
    });
  }

  /**
   * Get complete lineage history
   */
  getHistory(): DataLineageHistory {
    return {
      uploadTime: this.uploadTime,
      lastModified: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : this.uploadTime,
      events: [...this.events],
      totalTransformations: this.events.filter((e) => e.action !== 'uploaded').length,
      currentRowCount: this.currentRowCount,
      originalRowCount: this.originalRowCount,
      dataTrustScore: this.calculateTrustScore(),
    };
  }

  /**
   * Calculate data trust score (0-100)
   * Based on: freshness, transformation count, data stability
   */
  private calculateTrustScore(): number {
    const lastEvent = this.events[this.events.length - 1];
    if (!lastEvent) return 50;

    let score = 100;

    // Deduct for age (1 point per hour old, max 30)
    const ageHours = (new Date().getTime() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60);
    score -= Math.min(30, Math.floor(ageHours));

    // Deduct for excessive transformations (2 points per transformation, max 20)
    const transformCount = this.events.filter((e) => e.action !== 'uploaded').length;
    score -= Math.min(20, transformCount * 2);

    // Deduct for significant row reduction (1 point per 5% loss, max 25)
    const rowLoss = ((this.originalRowCount - this.currentRowCount) / this.originalRowCount) * 100;
    score -= Math.min(25, Math.floor(rowLoss / 5));

    // Bonus for stability (if row count unchanged in recent transformations, +5)
    if (transformCount > 0 && this.events[this.events.length - 1].rowCountChange === 0) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get freshness assessment
   */
  getFreshness(): {
    ageHours: number;
    ageLabel: string;
    freshFlag: boolean;
    recommendation: string;
  } {
    const lastEvent = this.events[this.events.length - 1];
    if (!lastEvent) {
      return {
        ageHours: 0,
        ageLabel: 'Just now',
        freshFlag: true,
        recommendation: 'Data is fresh',
      };
    }

    const ageHours = (new Date().getTime() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60);

    let ageLabel = '';
    let freshFlag = true;
    let recommendation = '';

    if (ageHours < 1) {
      ageLabel = 'Just now';
      recommendation = '✅ Data is very fresh';
    } else if (ageHours < 24) {
      ageLabel = `${Math.floor(ageHours)}h ago`;
      recommendation = '✅ Data is fresh';
    } else if (ageHours < 168) {
      ageLabel = `${Math.floor(ageHours / 24)} days ago`;
      recommendation = '⚠️ Data is moderately aged';
    } else {
      ageLabel = `${Math.floor(ageHours / 168)} weeks ago`;
      freshFlag = false;
      recommendation = '⚠️ Consider refreshing data';
    }

    return {
      ageHours: Math.round(ageHours * 10) / 10,
      ageLabel,
      freshFlag,
      recommendation,
    };
  }

  /**
   * Get impact summary of all transformations
   */
  getImpactSummary(): {
    totalFilters: number;
    totalAggregations: number;
    totalTransforms: number;
    rowsRemoved: number;
    completenessImpact: number;
  } {
    const filters = this.events.filter((e) => e.action === 'filtered');
    const aggregations = this.events.filter((e) => e.action === 'aggregated');
    const transforms = this.events.filter((e) => e.action === 'transformed');

    const totalFilters = filters.length;
    const totalAggregations = aggregations.length;
    const totalTransforms = transforms.length;
    const rowsRemoved = this.originalRowCount - this.currentRowCount;
    const completenessImpact = (rowsRemoved / this.originalRowCount) * 100;

    return {
      totalFilters,
      totalAggregations,
      totalTransforms,
      rowsRemoved,
      completenessImpact: Math.round(completenessImpact * 100) / 100,
    };
  }

  /**
   * Export lineage as readable timeline
   */
  exportTimeline(): string {
    let timeline = '📊 DATA LINEAGE TIMELINE\n';
    timeline += '========================\n\n';
    timeline += `📅 Upload: ${this.uploadTime.toLocaleString()}\n`;
    timeline += `📈 Original Rows: ${this.originalRowCount}\n`;
    timeline += `📉 Current Rows: ${this.currentRowCount}\n`;
    timeline += `⭐ Trust Score: ${this.calculateTrustScore()}/100\n\n`;

    timeline += 'TRANSFORMATIONS:\n';
    this.events.forEach((event, idx) => {
      const time = event.timestamp.toLocaleTimeString();
      const arrow = event.rowCountChange < 0 ? '📉' : event.rowCountChange > 0 ? '📈' : '→';
      timeline += `${idx + 1}. [${time}] ${arrow} ${event.action.toUpperCase()}\n`;
      timeline += `   ${event.description}\n`;
      timeline += `   Rows: ${event.previousRowCount} → ${event.affectedRows} (${event.rowCountChange > 0 ? '+' : ''}${event.rowCountChange})\n\n`;
    });

    return timeline;
  }
}

// Create singleton instance
export const lineageTracker = new LineageTracker();

/**
 * Get lineage history (non-singleton version)
 */
export function createNewLineageTracker(): LineageTracker {
  return new LineageTracker();
}
