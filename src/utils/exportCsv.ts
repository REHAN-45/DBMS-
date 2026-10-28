/**
 * Converts an array of objects to CSV format and prompts a browser download.
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvLines: string[] = [];

  // Header line
  csvLines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of rows) {
    const line = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) {
        return '""';
      }
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvLines.push(line.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvLines.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
