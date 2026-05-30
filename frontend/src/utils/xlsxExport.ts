export type SpreadsheetCell = string | number | boolean | null | undefined;

export interface SpreadsheetSheet {
  name: string;
  headers: string[];
  rows: SpreadsheetCell[][];
}

interface ZipFile {
  name: string;
  content: string;
}

const textEncoder = new TextEncoder();

const escapeXml = (value: SpreadsheetCell) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const columnName = (columnIndex: number) => {
  let column = '';
  let index = columnIndex;

  while (index > 0) {
    const remainder = (index - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    index = Math.floor((index - 1) / 26);
  }

  return column;
};

const cellRef = (rowIndex: number, columnIndex: number) => `${columnName(columnIndex)}${rowIndex}`;

const invalidSheetNameCharacters = new Set(['[', ']', ':', '*', '?', '/', '\\']);

const sanitizeSheetName = (name: string) =>
  Array.from(name)
    .map((character) => (invalidSheetNameCharacters.has(character) ? ' ' : character))
    .join('')
    .slice(0, 31)
    .trim() || 'Sheet';

const buildCellXml = (cell: SpreadsheetCell, rowIndex: number, columnIndex: number) => {
  const reference = cellRef(rowIndex, columnIndex);

  if (typeof cell === 'number' && Number.isFinite(cell)) {
    return `<c r="${reference}"><v>${cell}</v></c>`;
  }

  if (typeof cell === 'boolean') {
    return `<c r="${reference}" t="b"><v>${cell ? 1 : 0}</v></c>`;
  }

  return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
};

const buildWorksheetXml = (sheet: SpreadsheetSheet) => {
  const rows = [sheet.headers, ...sheet.rows];
  const columnCount = Math.max(sheet.headers.length, ...sheet.rows.map((row) => row.length));
  const dimension = `${cellRef(1, 1)}:${cellRef(Math.max(rows.length, 1), Math.max(columnCount, 1))}`;
  const columnWidths = Array.from({ length: columnCount }, (_, index) => {
    const column = index + 1;
    return `<col min="${column}" max="${column}" width="18" customWidth="1"/>`;
  }).join('');
  const rowXml = rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((cell, columnIndex) => buildCellXml(cell, rowIndex + 1, columnIndex + 1))
          .join('')}</row>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimension}"/>
  <cols>${columnWidths}</cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
};

const buildWorkbookXml = (sheets: SpreadsheetSheet[]) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((sheet, index) => `<sheet name="${escapeXml(sanitizeSheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}
  </sheets>
</workbook>`;

const buildWorkbookRelsXml = (sheets: SpreadsheetSheet[]) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join('')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const buildContentTypesXml = (sheets: SpreadsheetSheet[]) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets
    .map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join('')}
</Types>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;

  bytes.forEach((byte) => {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  });

  return (crc ^ 0xffffffff) >>> 0;
};

const pushUInt16 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff);
};

const pushUInt32 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
};

const pushBytes = (target: number[], bytes: Uint8Array) => {
  bytes.forEach((byte) => target.push(byte));
};

const getDosDateTime = () => {
  const now = new Date();
  const year = Math.max(now.getFullYear(), 1980);
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  return { dosDate, dosTime };
};

const createZip = (files: ZipFile[]) => {
  const output: number[] = [];
  const centralDirectory: number[] = [];
  const { dosDate, dosTime } = getDosDateTime();
  const encodedFiles = files.map((file) => ({
    name: textEncoder.encode(file.name),
    content: textEncoder.encode(file.content),
  }));

  encodedFiles.forEach((file) => {
    const localHeaderOffset = output.length;
    const checksum = crc32(file.content);

    pushUInt32(output, 0x04034b50);
    pushUInt16(output, 20);
    pushUInt16(output, 0x0800);
    pushUInt16(output, 0);
    pushUInt16(output, dosTime);
    pushUInt16(output, dosDate);
    pushUInt32(output, checksum);
    pushUInt32(output, file.content.length);
    pushUInt32(output, file.content.length);
    pushUInt16(output, file.name.length);
    pushUInt16(output, 0);
    pushBytes(output, file.name);
    pushBytes(output, file.content);

    pushUInt32(centralDirectory, 0x02014b50);
    pushUInt16(centralDirectory, 20);
    pushUInt16(centralDirectory, 20);
    pushUInt16(centralDirectory, 0x0800);
    pushUInt16(centralDirectory, 0);
    pushUInt16(centralDirectory, dosTime);
    pushUInt16(centralDirectory, dosDate);
    pushUInt32(centralDirectory, checksum);
    pushUInt32(centralDirectory, file.content.length);
    pushUInt32(centralDirectory, file.content.length);
    pushUInt16(centralDirectory, file.name.length);
    pushUInt16(centralDirectory, 0);
    pushUInt16(centralDirectory, 0);
    pushUInt16(centralDirectory, 0);
    pushUInt16(centralDirectory, 0);
    pushUInt32(centralDirectory, 0);
    pushUInt32(centralDirectory, localHeaderOffset);
    pushBytes(centralDirectory, file.name);
  });

  const centralDirectoryOffset = output.length;
  pushBytes(output, Uint8Array.from(centralDirectory));

  pushUInt32(output, 0x06054b50);
  pushUInt16(output, 0);
  pushUInt16(output, 0);
  pushUInt16(output, files.length);
  pushUInt16(output, files.length);
  pushUInt32(output, centralDirectory.length);
  pushUInt32(output, centralDirectoryOffset);
  pushUInt16(output, 0);

  return Uint8Array.from(output);
};

export const createXlsxBlob = (sheets: SpreadsheetSheet[]) => {
  const files: ZipFile[] = [
    { name: '[Content_Types].xml', content: buildContentTypesXml(sheets) },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'xl/workbook.xml', content: buildWorkbookXml(sheets) },
    { name: 'xl/_rels/workbook.xml.rels', content: buildWorkbookRelsXml(sheets) },
    { name: 'xl/styles.xml', content: stylesXml },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: buildWorksheetXml(sheet),
    })),
  ];
  const zipBytes = createZip(files);

  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};
