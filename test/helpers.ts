import fs from 'node:fs';
import path from 'node:path';

export function readCsv(file: string): Record<string, string>[] {
  const p = path.resolve(process.cwd(), file);
  const text = fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.map((line) => {
    const cols = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? '').trim();
    });
    return row;
  });
}

export function near(a: number, b: number, tol = 1e-6): boolean {
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (!Number.isFinite(a) && !Number.isFinite(b)) return true;
  return Math.abs(a - b) <= tol;
}

export function extractColumn(rows: Record<string, string>[], key: string): number[] {
  return rows.map(r => (r[key] ? Number(r[key]) : NaN));
}
