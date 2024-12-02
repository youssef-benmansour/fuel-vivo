import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { Table, Button, Card, Input, Select, DatePicker, message, Progress, Tooltip, Modal, Upload as AntUpload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useImportHistory } from '../hooks/useImportHistory';
import { importData } from '../services/api';
import ValidationResults from '../components/FileImport/ValidationResults';
import '../styles/DataImport.css';

const { Option } = Select;

const entityNameMap = {
  trucks: 'Camions',
  clients: 'Clients',
  products: 'Produits',
  tanks: 'Bacs',
  plants: 'Dépôts',
  prices: 'Prix'
};

const isValidFile = (file) => {
  return file && typeof file === 'object' && 'name' in file && 'type' in file && 'size' in file;
};

const DataImport = () => {
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('clients');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const {
    importHistory,
    currentPage,
    itemsPerPage,
    totalPages,
    isLoading,
    error,
    setCurrentPage,
    setItemsPerPage,
    refreshImportHistory
  } = useImportHistory();

  const handleFileChange = useCallback((info) => {
    const { file, fileList } = info;
    console.log('File change event:', file, fileList);

    if (file.status !== 'uploading') {
      console.log('File selected:', file);
      setFile(file);
      handleFilePreview(file);
    }
  }, []);

  const handleFilePreview = useCallback((file) => {
    console.log('Previewing file:', file);
    if (!isValidFile(file)) {
      console.error('Invalid file object:', file);
      message.error('Invalid file selected. Please try again.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log('File read successfully');
        const content = e.target.result;
        let previewRows = [];

        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          previewRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          // Convert to the format expected by the Table component
          const headers = previewRows[0];
          previewRows = previewRows.slice(1, 6).map((row, index) => {
            const rowData = {};
            headers.forEach((header, i) => {
              rowData[header] = row[i];
            });
            rowData.key = `preview-${index}`;
            return rowData;
          });
        } else {
          // Assume it's a CSV file
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          previewRows = lines.slice(1, 6).map((line, index) => {
            const values = line.split(',');
            return headers.reduce((obj, header, i) => {
              obj[header.trim()] = values[i];
              return obj;
            }, { key: `preview-${index}` });
          });
        }

        console.log('Preview data:', previewRows);
        setPreviewData(previewRows);
        setShowPreview(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        message.error('Error parsing file. Please ensure it\'s a valid CSV or Excel file.');
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      message.error('Error reading file. Please try again.');
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleImport = useCallback(async () => {
    if (!file || !importType) {
      message.error('Please select a file and import type');
      return;
    }

    setImporting(true);
    setImportProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('importType', importType);
    formData.append('replaceExisting', 'true');

    try {
      const intervalId = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await importData(importType, formData);

      clearInterval(intervalId);
      setImportProgress(100);

      setImportResult({
        importType,
        status: result.status || 'Completed',
        recordsImported: result.count,
        details: result.details
      });
      setShowResultModal(true);
      await refreshImportHistory();
    } catch (error) {
      console.error('Error during import:', error);
      message.error('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  }, [file, importType, refreshImportHistory]);

  const columns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (text) => text ? new Date(text).toLocaleString() : 'N/A' },
    { title: 'Type', dataIndex: 'importType', key: 'importType', render: (text) => entityNameMap[text] || text },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => status ? (
        <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
          {status}
        </span>
      ) : 'N/A'
    },
    { title: 'Records Imported', dataIndex: 'recordsImported', key: 'recordsImported' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setImportResult(record);
            setShowResultModal(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="data-import-container">
      <Card title="Import New Data" className="import-card">
        <div className="import-form">
          <Select
            style={{ width: 200 }}
            placeholder="Select import type"
            onChange={setImportType}
            value={importType}
          >
            {Object.entries(entityNameMap).map(([key, value]) => (
              <Option key={key} value={key}>{value}</Option>
            ))}
          </Select>
          <AntUpload
            accept=".csv,.xlsx"
            beforeUpload={() => false}
            onChange={handleFileChange}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Select File</Button>
          </AntUpload>
        </div>

        {file && (
          <div className="file-info">
            <File className="file-icon" />
            <span>{file.name}</span>
            <Button type="link" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <EyeOff /> : <Eye />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        )}

        <AnimatePresence>
          {showPreview && previewData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="preview-container"
            >
              <h3>Data Preview</h3>
              <Table
                dataSource={previewData}
                columns={Object.keys(previewData[0] || {}).filter(key => key !== 'key').map(key => ({ title: key, dataIndex: key, key }))}
                pagination={false}
                scroll={{ x: true }}
                rowKey="key"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="primary"
          onClick={handleImport}
          disabled={!file || !importType || importing}
          loading={importing}
          icon={<Upload />}
        >
          {importing ? 'Importing...' : 'Start Import'}
        </Button>

        {importing && (
          <Progress percent={importProgress} status="active" />
        )}
      </Card>

      <Card title="Import History" className="history-card">
        <Table
          dataSource={importHistory}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: itemsPerPage,
            total: totalPages * itemsPerPage,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setItemsPerPage(pageSize);
            },
          }}
          rowKey={(record) => record.id || `history-${record.createdAt}`}
        />
      </Card>

      <Modal
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        footer={null}
        width={800}
      >
        {importResult && <ValidationResults results={importResult} />}
      </Modal>
    </div>
  );
};

export default DataImport;