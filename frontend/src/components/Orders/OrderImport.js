import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, FileText, RefreshCw, Eye, EyeOff } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { getProducts, getClients, getPlants, getTrucks, importOrders } from '../../services/api';
import { toast } from 'react-toastify';
import { Button, message, Progress, Table, Modal } from 'antd';
import '../../styles/orderImport.css';

const OrderImport = ({ onImportComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [plants, setPlants] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [priceErrors, setPriceErrors] = useState([]);

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      const [productsRes, clientsRes, plantsRes, trucksRes] = await Promise.all([
        getProducts(),
        getClients(),
        getPlants(),
        getTrucks()
      ]);
      setProducts(productsRes.data);
      setClients(clientsRes.data);
      setPlants(plantsRes.data);
      setTrucks(trucksRes.data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to fetch necessary data. Please try again.');
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setFile(file);
    handleFilePreview(file);
    setImportError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const parseFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        let parsedData = [];
        let recordCount = 0;

        if (file.name.endsWith('.csv')) {
          Papa.parse(data, {
            complete: (results) => {
              parsedData = results.data;
              recordCount = results.data.length - 1; // Subtract header row
              resolve({ parsedData, recordCount });
            },
            header: true,
            skipEmptyLines: true
          });
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          recordCount = parsedData.length - 1; // Subtract header row
          
          const headers = parsedData[0];
          parsedData = parsedData.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve({ parsedData, recordCount });
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleFilePreview = async (file) => {
    try {
      const { parsedData, recordCount } = await parseFile(file);
      setImportPreview(parsedData.slice(0, 5));
      setTotalRecords(recordCount);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing file:', error);
      setImportError('Unable to preview file. Please ensure it\'s in the correct format.');
      toast.error('Error previewing file. Please try again.');
    }
  };

  const cleanData = (data) => {
    return data.map(order => ({
      ...order,
      'Material Code': typeof order['Material Code'] === 'string' 
        ? order['Material Code'].replace(/^0+/, '')
        : order['Material Code'],
      'Pat.Doc': order['Pat.Doc'] && typeof order['Pat.Doc'] === 'string'
        ? order['Pat.Doc'].replace(/^0+/, '')
        : order['Pat.Doc'],
      'Trip Num': order['Trip Num'] && typeof order['Trip Num'] === 'string'
        ? order['Trip Num'].replace(/^0+/, '')
        : order['Trip Num'],
      'Vehicle Id': order['Vehicle Id'] && typeof order['Vehicle Id'] === 'string'
        ? order['Vehicle Id'].replace(/-/g, '')
        : order['Vehicle Id']
    }));
  };

  const validateOrders = (orders) => {
    const errors = [];
    const productCodes = new Set(products.map(p => p.Material));
    const customerCodes = new Set(clients.map(c => c['Customer Sold to']));
    const shipToParties = new Set(clients.map(c => String(c['Customer Ship to'])));
    const plantCodes = new Set(plants.map(p => p['Plant Code']));
    const vehicleIds = new Set(trucks.map(t => t.Vehicle));

    orders.forEach((order, index) => {
      if (!productCodes.has(String(order['Material Code']))) {
        errors.push(`Row ${index + 1}: Material Code "${order['Material Code']}" not found in products`);
      }

      if (order['Order Type'] === 'ZCON') {
        const plantCode = order.Customer.startsWith('CP') ? order.Customer.slice(2) : order.Customer;
        if (!plantCodes.has(plantCode)) {
          errors.push(`Row ${index + 1}: Plant Code "${plantCode}" not found in plants for ZCON order`);
        }
      } else {
        if (!customerCodes.has(String(order['Customer']))) {
          errors.push(`Row ${index + 1}: Customer "${order['Customer']}" not found in clients`);
        }
        if (!shipToParties.has(String(order['Ship To Party']))) {
          errors.push(`Row ${index + 1}: Ship To Party "${order['Ship To Party']}" not found in clients`);
        }
      }

      if (!plantCodes.has(String(order['Plant']))) {
        errors.push(`Row ${index + 1}: Plant "${order['Plant']}" not found in plants`);
      }
      if (order['Vehicle Id'] && !vehicleIds.has(String(order['Vehicle Id']))) {
        errors.push(`Row ${index + 1}: Vehicle Id "${order['Vehicle Id']}" not found in trucks`);
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (!file) {
      setImportError('Please select a file to import.');
      toast.error('Please select a file to import.');
      return;
    }
  
    setImporting(true);
    setImportError(null);
    setImportProgress(0);
    setPriceErrors([]);
  
    try {
      const { parsedData } = await parseFile(file);
      
      const cleanedData = cleanData(parsedData);
  
      const validationErrors = validateOrders(cleanedData);
      if (validationErrors.length > 0) {
        throw new Error('Validation failed: ' + validationErrors.join('; '));
      }
  
      const totalOrders = cleanedData.length;
      let importedCount = 0;
  
      const batchSize = 100;
      for (let i = 0; i < cleanedData.length; i += batchSize) {
        const batch = cleanedData.slice(i, i + batchSize);
        try {
          // Process ZCON orders
          const processedBatch = batch.map(order => {
            if (order['Order Type'] === 'ZCON') {
              const plantCode = order.Customer.startsWith('CP') ? order.Customer.slice(2) : order.Customer;
              const plant = plants.find(p => p['Plant Code'] === plantCode);
              if (plant) {
                return {
                  ...order,
                  Customer: `CP${plantCode}`,
                  'Customer Name': plant.Description,
                  'Ship To Party': `CP${plantCode}`,
                  'Ship To Name': plant.Description,
                  'City(Ship To)': 'Casablanca'
                };
              }
            }
            return order;
          });

          const response = await importOrders(processedBatch);
          importedCount += response.data.ordersCreated;
          setImportProgress(Math.round((importedCount / totalOrders) * 100));
          
          // Check for price-related errors
          if (response.data.errors) {
            const newPriceErrors = response.data.errors.filter(error => 
              error.error.includes('No price found')
            );
            setPriceErrors(prevErrors => [...prevErrors, ...newPriceErrors]);
          }
        } catch (error) {
          console.error('Error importing batch:', error);
          throw new Error(`Error importing orders batch ${i / batchSize + 1}: ${error.message}`);
        }
      }
  
      if (priceErrors.length > 0) {
        message.warning(`Import completed with ${priceErrors.length} price-related errors. Please check the error list.`);
      } else {
        toast.success(`Successfully imported ${importedCount} orders`);
      }
      onImportComplete();
    } catch (error) {
      console.error('Error importing orders:', error);
      const errorMessage = error.message || 'Failed to import orders. Please ensure all entities are up to date.';
      setImportError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const handleCancel = () => {
    if (importing) {
      if (window.confirm('Are you sure you want to cancel the import? This will stop the process.')) {
        setImporting(false);
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleRetry = () => {
    setFile(null);
    setImportError(null);
    setImportPreview(null);
    setTotalRecords(0);
    setImportProgress(0);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewColumns = importPreview && importPreview.length > 0
    ? Object.keys(importPreview[0]).map(key => ({
        title: key,
        dataIndex: key,
        key: key,
      }))
    : [];

  return (
    <div className="order-import-container">
      <h2 className="import-title">Import Orders</h2>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'file-selected' : ''}`}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        {file ? (
          <div className="file-info">
            <FileText className="file-icon" />
            <span className="file-name">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              className="remove-file"
            >
              <X className="remove-icon" />
            </button>
          </div>
        ) : isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag & drop a CSV or Excel file here, or click to select a file</p>
        )}
      </div>

      {importError && (
        <div className="error-message">
          <AlertCircle className="error-icon" />
          <p>{importError}</p>
        </div>
      )}

      {file && !importError && (
        <div className="file-details">
          <p>Total records: {totalRecords}</p>
          <Button onClick={() => setShowPreview(!showPreview)} icon={showPreview ? <EyeOff /> : <Eye />}>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {showPreview && importPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="preview-container"
          >
            <h3>Import Preview</h3>
            <Table
              dataSource={importPreview}
              columns={previewColumns}
              pagination={false}
              scroll={{ x: true }}
            />
            <p className="preview-note">Showing {importPreview.length} out of {totalRecords} records</p>
          </motion.div>
        )}
      </AnimatePresence>

      {importing && (
        <Progress percent={importProgress} status="active" />
      )}

      <div className="action-buttons">
        <Button onClick={handleCancel} disabled={importing}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleImport}
          disabled={!file || importing}
          loading={importing}
          icon={<Upload />}
        >
          {importing ? 'Importing...' : 'Start Import'}
        </Button>
      </div>
      {priceErrors.length > 0 && (
        <Modal
          title="Price-related Errors"
          visible={true}
          onOk={() => setPriceErrors([])}
          onCancel={() => setPriceErrors([])}
        >
          <ul>
            {priceErrors.map((error, index) => (
              <li key={index}>{error.error}</li>
            ))}
          </ul>
          <p>Please update the price data for these products and clients before importing.</p>
        </Modal>
      )}
    </div>
  );
};

export default OrderImport;