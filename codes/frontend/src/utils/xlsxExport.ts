export type SpreadsheetCell = string | number | boolean | null | undefined;

export interface SpreadsheetSheet {
  name: string;
  headers: string[];
  rows: SpreadsheetCell[][];
}

type ColumnKind = 'text' | 'currency' | 'integer' | 'decimal' | 'date';

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

const currencyHeaderTerms = ['salary', 'allowance', 'gross', 'net', 'pf', 'esi', 'tax', 'bonus', 'deductions'];
const integerHeaders = new Set(['employees', 'days present', 'paid leaves', 'unpaid leaves']);
const decimalHeaders = new Set(['overtime hours']);

const inferColumnKind = (header: string): ColumnKind => {
  const normalizedHeader = header.toLowerCase();

  if (normalizedHeader.includes('date')) return 'date';
  if (currencyHeaderTerms.some((term) => normalizedHeader.includes(term))) return 'currency';
  if (integerHeaders.has(normalizedHeader)) return 'integer';
  if (decimalHeaders.has(normalizedHeader)) return 'decimal';

  return 'text';
};

const getCellStyleId = (columnKind: ColumnKind, isBandedRow: boolean) => {
  if (columnKind === 'currency') return isBandedRow ? 6 : 5;
  if (columnKind === 'integer') return isBandedRow ? 8 : 7;
  if (columnKind === 'decimal') return isBandedRow ? 10 : 9;
  if (columnKind === 'date') return isBandedRow ? 12 : 11;

  return isBandedRow ? 4 : 3;
};

const estimateColumnWidth = (sheet: SpreadsheetSheet, columnIndex: number) => {
  const values: SpreadsheetCell[] = [sheet.headers[columnIndex] ?? '', ...sheet.rows.map((row) => row[columnIndex])];
  const maxLength = values.reduce<number>((longest, value) => Math.max(longest, String(value ?? '').length), 0);
  const header = sheet.headers[columnIndex]?.toLowerCase() ?? '';
  const maxWidth = header.includes('email') ? 34 : 26;

  return Math.min(Math.max(maxLength + 3, 12), maxWidth);
};

const buildCellXml = (cell: SpreadsheetCell, rowIndex: number, columnIndex: number, styleId = 0) => {
  const reference = cellRef(rowIndex, columnIndex);
  const style = ` s="${styleId}"`;

  if (typeof cell === 'number' && Number.isFinite(cell)) {
    return `<c r="${reference}"${style}><v>${cell}</v></c>`;
  }

  if (typeof cell === 'boolean') {
    return `<c r="${reference}"${style} t="inlineStr"><is><t>${cell ? 'Yes' : 'No'}</t></is></c>`;
  }

  return `<c r="${reference}"${style} t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
};

const buildWorksheetXml = (sheet: SpreadsheetSheet) => {
  const columnCount = Math.max(1, sheet.headers.length, ...sheet.rows.map((row) => row.length));
  const rowCount = Math.max(2, sheet.rows.length + 2);
  const dimension = `${cellRef(1, 1)}:${cellRef(rowCount, columnCount)}`;
  const columnWidths = Array.from({ length: columnCount }, (_, index) => {
    const column = index + 1;
    return `<col min="${column}" max="${column}" width="${estimateColumnWidth(sheet, index)}" customWidth="1"/>`;
  }).join('');
  const headerXml = `<row r="2" ht="24" customHeight="1">${sheet.headers
    .map((header, columnIndex) => buildCellXml(header, 2, columnIndex + 1, 2))
    .join('')}</row>`;
  const bodyXml = sheet.rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 3}" ht="21" customHeight="1">${row
          .map((cell, columnIndex) =>
            buildCellXml(
              cell,
              rowIndex + 3,
              columnIndex + 1,
              getCellStyleId(inferColumnKind(sheet.headers[columnIndex] ?? ''), rowIndex % 2 === 1),
            ),
          )
          .join('')}</row>`,
    )
    .join('');
  const rowXml = `<row r="1" ht="30" customHeight="1">${buildCellXml(sheet.name, 1, 1, 1)}</row>${headerXml}${bodyXml}`;
  const filterRef = `${cellRef(2, 1)}:${cellRef(Math.max(rowCount, 2), columnCount)}`;
  const titleMergeRef = `${cellRef(1, 1)}:${cellRef(1, columnCount)}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimension}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${columnWidths}</cols>
  <sheetData>${rowXml}</sheetData>
  <autoFilter ref="${filterRef}"/>
  <mergeCells count="1"><mergeCell ref="${titleMergeRef}"/></mergeCells>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
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
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="&quot;INR&quot; #,##0"/>
    <numFmt numFmtId="165" formatCode="yyyy-mm-dd"/>
    <numFmt numFmtId="166" formatCode="0.00"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0D47A1"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1565C0"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF6FAFD"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFB7C9D8"/></left>
      <right style="thin"><color rgb="FFB7C9D8"/></right>
      <top style="thin"><color rgb="FFB7C9D8"/></top>
      <bottom style="thin"><color rgb="FFB7C9D8"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="13">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="1" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="166" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
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
