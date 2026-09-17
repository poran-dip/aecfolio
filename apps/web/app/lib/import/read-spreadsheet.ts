import ExcelJS from "exceljs";
import Papa from "papaparse";

export type RawRow = Record<string, string>;

export const SPREADSHEET_EXTENSIONS = ["csv", "xlsx"] as const;

function readCsv(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: reject,
    });
  });
}

async function readXlsx(file: File): Promise<RawRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: RawRow[] = [];
  let headers: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1);
    if (rowNumber === 1) {
      headers = values.map((v) => String(v ?? ""));
      return;
    }
    const record: RawRow = {};
    headers.forEach((header, i) => {
      record[header] = String(values[i] ?? "");
    });
    rows.push(record);
  });

  return rows;
}

export function readSpreadsheet(file: File): Promise<RawRow[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return readCsv(file);
  if (ext === "xlsx") return readXlsx(file);
  return Promise.reject(new Error("Only .csv and .xlsx files are supported."));
}
