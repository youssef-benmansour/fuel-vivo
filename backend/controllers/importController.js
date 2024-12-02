const { Truck, Price, Plant, Product, Client, Tank, ImportHistory, Order, sequelize } = require('../models');
const { Op } = require('sequelize');
const { parseFile, cleanColumnName } = require('../utils/fileParser');
const upsertModels = ['prices', 'tanks', 'products', 'trucks', 'clients']; // Added 'clients' to use upsert

const DEFAULT_PRODUCT_VALUES = {
  '31280': { density: 0.7550, temp: 15, type: 'FUEL' },
  '61983': { density: 0.8000, temp: 15, type: 'FUEL' },
  '61988': { density: 0.7550, temp: 15, type: 'FUEL' },
  '81357': { density: 1.0000, temp: 15, type: 'FUEL' },
  '81358': { density: 0.8450, temp: 15, type: 'FUEL' },
  '81359': { density: 0.8450, temp: 15, type: 'FUEL' },
  '81360': { density: 0.8450, temp: 15, type: 'FUEL' },
  '81363': { density: 0.7550, temp: 15, type: 'FUEL' },
  '81364': { density: 0.7134, temp: 15, type: 'FUEL' },
  '30876': { density: 0.5800, temp: 20, type: 'LPG' },
  '81173': { density: 0.5290, temp: 20, type: 'LPG' },
  '12882': { density: 0.8881, temp: 15, type: 'LUBE' },
  '81538': { density: 0.8881, temp: 15, type: 'LUBE' },
  '81539': { density: 0.8881, temp: 15, type: 'LUBE' },
  '81540': { density: 0.8881, temp: 15, type: 'LUBE' },
  '81566': { density: 0.8881, temp: 15, type: 'LUBE' },
  '97901': { density: 0.8881, temp: 15, type: 'LUBE' },
};

// Helper function for error handling
const handleError = (res, error, entityName) => {
  console.error(`Error fetching ${entityName}:`, error);
  res.status(500).json({ message: `Error fetching ${entityName}`, error: error.message });
};


exports.getAllTrucks = async (req, res) => {
  try {
    const trucks = await Truck.findAll();
    res.json(trucks);
  } catch (error) {
    handleError(res, error, 'trucks');
  }
};

exports.getAllPrices = async (req, res) => {
  try {
    const prices = await Price.findAll();
    res.json(prices);
  } catch (error) {
    handleError(res, error, 'prices');
  }
};

exports.getAllPlants = async (req, res) => {
  try {
    const plants = await Plant.findAll();
    res.json(plants);
  } catch (error) {
    handleError(res, error, 'plants');
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    handleError(res, error, 'products');
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (error) {
    handleError(res, error, 'clients');
  }
};

exports.getAllTanks = async (req, res) => {
  try {
    const tanks = await Tank.findAll();
    res.json(tanks);
  } catch (error) {
    handleError(res, error, 'tanks');
  }
};

const modelMap = {
  clients: Client,
  trucks: Truck,
  products: Product,
  tanks: Tank,
  plants: Plant,
  prices: Price,
  orders: Order
};

const fieldMap = {
  plants: {
    'Plant  Code': 'Plant Code'
  },
  trucks: {
    'MPGI- Material-Planning-Group': 'MPGI',
    'MPGI Material Planning Group': 'MPGI',
    'MPGI': 'MPGI'
  }
};

const processRecord = (record, importType) => {
  console.log('Processing record:', record);
  const processedRecord = Object.keys(record).reduce((acc, key) => {
    const cleanKey = cleanColumnName(key);
    const mappedKey = fieldMap[importType]?.[cleanKey] || cleanKey;
    
    console.log(`Field mapping: "${key}" -> "${cleanKey}" -> "${mappedKey}"`);
    
    let value = record[key];
    
    if (typeof value === 'object' && value !== null) {
      value = value.error === '#N/A' ? null : JSON.stringify(value);
    } else if (typeof value === 'string') {
      value = value.trim().toLowerCase() === '#n/a' || value.trim() === '' ? null :
              (!isNaN(value) && importType !== 'clients' ? Number(value) : value);
    }
    
    acc[mappedKey] = value;
    console.log(`Processed field: ${mappedKey} = ${value}`);
    return acc;
  }, {});

  // For products, ensure density, temp, and type are set to null if not present
  if (importType === 'products' && !DEFAULT_PRODUCT_VALUES[processedRecord.Material]) {
    processedRecord.density = null;
    processedRecord.temp = null;
    processedRecord.type = null;
  }

  // For products, apply default values if available
  if (importType === 'products' && DEFAULT_PRODUCT_VALUES[processedRecord.Material]) {
    const defaultValues = DEFAULT_PRODUCT_VALUES[processedRecord.Material];
    processedRecord.density = defaultValues.density;
    processedRecord.temp = defaultValues.temp;
    processedRecord.type = defaultValues.type;
  }

  return processedRecord;
};

exports.getImportPreview = async (req, res) => {
  try {
    const importId = req.params.id;
    const importRecord = await ImportHistory.findByPk(importId);

    if (!importRecord) {
      return res.status(404).json({ message: 'Import record not found' });
    }

    // Parse the details JSON string
    const details = JSON.parse(importRecord.details);

    // Prepare the preview data
    const previewData = {
      importType: importRecord.importType,
      fileName: importRecord.fileName,
      status: importRecord.status,
      recordsImported: importRecord.recordsImported,
      items: [],
      totalItems: 0,
    };

    // Extract summary data
    if (details.created) previewData.items.push({ type: 'Created', count: details.created });
    if (details.updated) previewData.items.push({ type: 'Updated', count: details.updated });
    if (details.deleted) previewData.items.push({ type: 'Deleted', count: details.deleted });

    previewData.totalItems = previewData.items.reduce((sum, item) => sum + item.count, 0);

    // Extract error information
    if (details.errors && Array.isArray(details.errors)) {
      previewData.errors = details.errors.slice(0, 10); // Show first 10 errors
      previewData.totalErrors = details.errors.length;
    }

    res.json(previewData);
  } catch (error) {
    console.error('Error fetching import preview:', error);
    res.status(500).json({ message: 'Error fetching import preview', error: error.message });
  }
};

exports.importData = async (req, res) => {
  const { importType } = req.params;
  const Model = modelMap[importType];
  const replaceExisting = req.body.replaceExisting === 'true';

  console.log(`Starting import for type: ${importType}`);

  if (!Model) {
    return res.status(400).json({ error: 'Invalid import type' });
  }

  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Parsing file:', file.path);
    const parsedData = await parseFile(file.path);
    
    if (!parsedData || parsedData.length === 0) {
      throw new Error('No data found in the uploaded file.');
    }

    console.log('First parsed record:', JSON.stringify(parsedData[0], null, 2));
  

    let deletedCount = 0;
    let importedRecords = [];
    let errors = [];

    if (replaceExisting) {
      deletedCount = await Model.destroy({ 
        where: {}, 
        truncate: true, 
        cascade: true
      });
      console.log(`Deleted ${deletedCount} existing ${importType} records`);
    }

    for (const record of parsedData) {
      try {
        const processedRecord = processRecord(record, importType);
        console.log('Processed record:', JSON.stringify(processedRecord, null, 2));
        
        delete processedRecord.id;

        let importedRecord;
        if (importType === 'prices') {
          [importedRecord] = await Model.upsert(processedRecord, {
            returning: true,
            fields: Object.keys(processedRecord),
          });
        } else if (upsertModels.includes(importType)) {
          const primaryKey = Model.primaryKeyAttribute;
          [importedRecord] = await Model.upsert(processedRecord, {
            returning: true,
            fields: Object.keys(processedRecord),
            conflictFields: [primaryKey]
          });
        } else {
          importedRecord = await Model.create(processedRecord);
        }
        console.log('Imported record:', JSON.stringify(importedRecord.toJSON(), null, 2));
        importedRecords.push(importedRecord);
      } catch (error) {
        console.error(`Error importing record:`, JSON.stringify(record, null, 2), error);
        errors.push({ record, error: error.message });
      }
    }

    await ImportHistory.create({
      importType,
      fileName: file.originalname,
      recordsImported: importedRecords.length,
      status: errors.length > 0 ? 'Completed with errors' : 'Completed',
      details: JSON.stringify({ 
        message: `Imported ${importedRecords.length} ${importType}`,
        deleted: deletedCount,
        errors: errors
      })
    });

    // Keep only the last 20 import history records
    const totalCount = await ImportHistory.count();
    if (totalCount > 20) {
      const recordsToDelete = totalCount - 20;
      const oldestRecords = await ImportHistory.findAll({
        order: [['createdAt', 'ASC']],
        limit: recordsToDelete
      });
      await ImportHistory.destroy({
        where: {
          id: {
            [Op.in]: oldestRecords.map(record => record.id)
          }
        }
      });
    }

    res.json({
      status: errors.length > 0 ? 'Completed with errors' : 'Completed',
      count: importedRecords.length,
      deleted: deletedCount,
      message: `Imported ${importedRecords.length} ${importType}`,
      errors: errors
    });

  } catch (error) {
    console.error('Import error:', error);
    
    await ImportHistory.create({
      importType,
      fileName: req.file ? req.file.originalname : 'Unknown',
      recordsImported: 0,
      status: 'Failed',
      details: JSON.stringify({ error: error.message })
    });

    res.status(500).json({ error: 'An error occurred during import: ' + error.message });
  }
};

exports.getImportHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ImportHistory.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      items: rows,
      totalItems: count,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'An error occurred while fetching import history' });
  }
};

module.exports = {
  getAllTrucks: exports.getAllTrucks,
  getAllPrices: exports.getAllPrices,
  getAllPlants: exports.getAllPlants,
  getAllProducts: exports.getAllProducts,
  getAllClients: exports.getAllClients,
  getAllTanks: exports.getAllTanks,
  importData: exports.importData,
  getImportHistory: exports.getImportHistory,
  getImportPreview: exports.getImportPreview
};