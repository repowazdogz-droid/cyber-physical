/**
 * Cost/Quality Dashboard
 * 
 * Generates machine-readable reports (JSON/CSV) for cost and quality metrics.
 * 
 * Version: 1.0.0
 */

import { SuiteReport, TaskResult } from './SwapHarness';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Dashboard row (one per task).
 */
export interface DashboardRow {
  task_id: string;
  mode: string;
  solved: number; // 0 or 1
  tier3_pass: number; // 0 or 1
  winner_cost_C: number;
  tokens: number;
  cost_usd: number;
  latency_ms: number;
  proposals_used: number;
  repairs_used: number;
  vault_hits: number;
  negative_evidence_written: number;
  top_failure_code: string;
}

/**
 * Generates dashboard report from suite report.
 */
export function generateDashboard(report: SuiteReport): DashboardRow[] {
  return report.task_results.map(result => ({
    task_id: result.task_id,
    mode: report.mode,
    solved: result.solved ? 1 : 0,
    tier3_pass: result.tier3_pass ? 1 : 0,
    winner_cost_C: result.winner_cost_C || 0,
    tokens: result.tokens || 0,
    cost_usd: result.cost_usd || 0,
    latency_ms: result.latency_ms || 0,
    proposals_used: result.proposals_used || 0,
    repairs_used: result.repairs_used || 0,
    vault_hits: result.vault_hits || 0,
    negative_evidence_written: result.negative_evidence_written || 0,
    top_failure_code: result.top_failure_code || ''
  }));
}

/**
 * Converts dashboard rows to CSV.
 */
export function dashboardToCSV(rows: DashboardRow[]): string {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const value = (row as any)[h];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ];

  return csvRows.join('\n');
}

/**
 * Writes dashboard report to files.
 */
export async function writeDashboardReport(
  report: SuiteReport,
  reportsDir: string
): Promise<void> {
  await writeFile(join(reportsDir, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');

  const rows = generateDashboard(report);
  const csv = dashboardToCSV(rows);
  await writeFile(join(reportsDir, 'latest.csv'), csv, 'utf8');
}























