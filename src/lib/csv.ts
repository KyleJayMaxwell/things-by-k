// src/lib/csv.ts
// Builds a CSV file from rows (used by the admin exports)

function cell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  // Stop spreadsheets from treating a cell as a formula
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n'
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
