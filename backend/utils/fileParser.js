const ExcelJS = require('exceljs');
const csv = require('csv-parse/sync');
const fs = require('fs');

const cleanColumnName = (name) => {
  const cleaned = name.replace(/\n/g, ' ').trim();
  console.log(`Cleaning column name: "${name}" -> "${cleaned}"`);
  return cleaned;
};

const parseCSV = (filePath) => {
  console.log('Parsing CSV file:', filePath);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = csv.parse(fileContent, {
    columns: headers => {
      console.log('Original CSV headers:', headers);
      const cleanedHeaders = headers.map(cleanColumnName);
      console.log('Cleaned CSV headers:', cleanedHeaders);
      return cleanedHeaders;
    },
    skip_empty_lines: true
  });
  console.log('First CSV record:', records[0]);
  return records;
};

const parseExcel = async (filePath) => {
  console.log('Parsing Excel file:', filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('The Excel file does not contain any worksheets.');
  }

  const data = [];
  const originalHeaders = worksheet.getRow(1).values.slice(1);
  console.log('Original Excel headers:', originalHeaders);
  const headers = originalHeaders.map(cleanColumnName);
  console.log('Cleaned Excel headers:', headers);

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const rowData = {};
      row.values.slice(1).forEach((value, index) => {
        if (headers[index]) {
          rowData[headers[index]] = value;
        }
      });
      data.push(rowData);
    }
  });

  console.log('First Excel record:', data[0]);
  return data;
};

exports.parseFile = async (filePath) => {
  const fileExtension = filePath.split('.').pop().toLowerCase();

  if (fileExtension === 'csv') {
    return parseCSV(filePath);
  } else if (['xlsx', 'xls'].includes(fileExtension)) {
    return parseExcel(filePath);
  } else {
    throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
  }
};

module.exports = {
  parseFile: exports.parseFile,
  cleanColumnName
};