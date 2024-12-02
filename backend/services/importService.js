const fs = require('fs');
const { parse } = require('csv-parse');
const xlsx = require('xlsx');
const { Client, Product, Tank, Truck, Plant, Price, ImportHistory, Order, Trip, sequelize } = require('../models');
const { Op, ValidationError } = require('sequelize');
const sequelize = require('../config/database');

const entityModels = {
  clients: Client,
  products: Product,
  tanks: Tank,
  trucks: Truck,
  plants: Plant,
  prices: Price
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
};

const processEntityImport = async (importType, data, replaceExisting) => {
  console.log(`Processing ${importType} import`);
  const Model = entityModels[importType];
  if (!Model) {
    throw new Error(`Invalid import type: ${importType}`);
  }

  const results = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: []
  };

  await sequelize.transaction(async (t) => {
    if (replaceExisting) {
      // Delete all existing records if replaceExisting is true
      const deletedCount = await Model.destroy({ 
        where: {}, 
        truncate: true, 
        cascade: true, 
        transaction: t 
      });
      results.deleted = deletedCount;
      console.log(`Deleted ${deletedCount} existing ${importType} records`);
    }

    for (const [index, item] of data.entries()) {
      try {
        console.log(`Processing item ${index + 1}:`, JSON.stringify(item, null, 2));
        
        // Data preprocessing based on entity type
        switch (importType) {
          case 'prices':
            item["Ship to SAP"] = item["Ship to SAP"].toString();
            item["SAP material"] = item["SAP material"].toString().padStart(13, '0');
            if (typeof item["Price Unit (HT)"] === 'string') {
              item["Price Unit (HT)"] = parseFloat(item["Price Unit (HT)"].replace(',', '.'));
            }
            break;
          case 'products':
            item.Material = item.Material.toString().padStart(13, '0');
            break;
          case 'trucks':
            // Convert numeric fields to numbers and handle 'N/A' values
            ['Vehicle-Weight', 'Vehicule Capacity', 'Comp1', 'Comp2', 'Comp3', 'Comp4', 'Comp5', 'Comp6', 'Comp7', 'Comp8', 'Comp9'].forEach(field => {
              item[field] = item[field] === 'N/A' ? null : parseFloat(item[field]);
            });
            break;
          // Add cases for other entity types if needed
        }

        const [record, created] = await Model.upsert(item, { 
          returning: true,
          transaction: t
        });

        if (created) {
          results.created++;
        } else {
          results.updated++;
        }

      } catch (error) {
        console.error(`Error processing item ${index + 1}:`, error);
        results.errors.push({
          item: item,
          error: error.message
        });
      }
    }
  });

  return results;
};

exports.importOrders = async (orderData) => {
  const results = {
    created: 0,
    errors: []
  };

  const t = await sequelize.transaction();

  try {
    for (const row of orderData) {
      try {
        const [customer] = await Client.findOrCreate({
          where: { customerSoldTo: row.Customer },
          defaults: {
            customerSoldToName: row['Customer Name'],
            customerShipTo: row['Ship To Party'],
            customerShipToName: row['Ship To Name'],
            customerShipToCity: row['City(Ship To)'],
            idFiscal: row['Pat.Doc']
          },
          transaction: t
        });

        const [plant] = await Plant.findOrCreate({
          where: { plantCode: row.Plant },
          defaults: { description: row['Plant Name'] },
          transaction: t
        });

        const [product] = await Product.findOrCreate({
          where: { material: row['Material Code'] },
          defaults: {
            materialDescription: row['Material Name'],
            baseUnitOfMeasure: row['Sls.UOM']
          },
          transaction: t
        });

        const orderData = {
          salesOrder: row['Sales Order'],
          orderType: row['Order Type'],
          status: 'Created',
          requestedDeliveryDate: row['Requested delivery date'],
          patDoc: row['Pat.Doc'],
          customerId: customer.id,
          shipToId: customer.id,
          plantId: plant.plantCode,
          materialCode: product.material,
          orderQty: parseFloat(row['Order Qty']),
          slsUOM: row['Sls.UOM'],
          valuationType: row['Valution Type']
        };

        await Order.create(orderData, { transaction: t });
        results.created++;
      } catch (error) {
        console.error('Error importing order:', error);
        results.errors.push({
          item: row,
          error: error.message
        });
      }
    }

    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }

  return results;
};

exports.processImport = async (importType, file, replaceExisting) => {
  console.log(`Starting import process for ${importType}`);
  try {
    let data;
    if (file.mimetype === 'text/csv') {
      console.log('Parsing CSV file');
      data = await parseCSV(file.path);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      console.log('Parsing Excel file');
      data = parseExcel(file.path);
    } else {
      throw new Error('Unsupported file type');
    }

    console.log(`Parsed ${data.length} rows from the file`);

    const result = await processEntityImport(importType, data, replaceExisting);

    // Save import history
    await ImportHistory.create({
      importType,
      fileName: file.originalname,
      recordsImported: result.created + result.updated,
      status: result.errors.length > 0 ? 'Completed with errors' : 'Completed',
      details: JSON.stringify({
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        errors: result.errors
      })
    });

    // Clean up the uploaded file
    fs.unlinkSync(file.path);

    return result;
  } catch (error) {
    console.error('Error in processImport:', error);
    // Clean up the uploaded file in case of error
    if (file.path) fs.unlinkSync(file.path);
    throw error;
  }
};

exports.getImportHistory = async (page, limit) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await ImportHistory.findAndCountAll({
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: offset
  });

  return {
    items: rows,
    totalItems: count,
    currentPage: page,
    totalPages: Math.ceil(count / limit)
  };
};