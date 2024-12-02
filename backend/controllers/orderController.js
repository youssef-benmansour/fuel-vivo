const { Order, Client, Product, Plant, Trip, Price, Truck, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

exports.getOrders = async (req, res) => {
  try {
    const { status, orderType, tripNum, startDate, endDate } = req.query;
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    if (orderType) {
      whereClause.order_type = orderType;
    }
    if (tripNum) {
      whereClause["Trip Num"] = tripNum;
    }
    if (startDate && endDate) {
      whereClause['updated_at'] = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: Client, as: 'CustomerInfo', attributes: ['Customer Sold to', 'Customer Sold to name'] },
        { model: Client, as: 'ShipToInfo', attributes: ['Customer Ship to', 'Customer ship to name', 'Customer ship to Address'] },
        { model: Product, as: 'Product', attributes: ['Material', 'Material description', 'Base Unit of Measure', 'density', 'temp'] },
        { model: Plant, as: 'PlantInfo', attributes: ['Plant Code', 'Description'] },
        { 
          model: Truck, 
          as: 'Truck',
          attributes: ['Vehicle', 'Driver CIN', 'Haulier number', 'Driver name', 'Trailer Number']
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the id is a valid number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findByPk(id, {
      include: [
        { model: Client, as: 'CustomerInfo', foreignKey: 'Customer', targetKey: 'Customer Sold to' },
        { model: Client, as: 'ShipToInfo', foreignKey: 'Ship To Party', targetKey: 'Customer Ship to' },
        { model: Product, as: 'Product', foreignKey: 'Material Code', targetKey: 'Material' },
        { model: Plant, as: 'PlantInfo', foreignKey: 'Plant', targetKey: 'Plant Code' }
      ]
    });

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    if (orderData['Trip Num']) {
      orderData.status = 'Truck Loading Confirmation';
    } else {
      orderData.status = 'Created';
    }

    // Calculate Total Price
    const price = await Price.findOne({
      where: {
        'Ship to SAP': orderData['Ship To Party'],
        'SAP material': orderData['Material Code']
      }
    });

    if (!price) {
      return res.status(400).json({ message: 'No price found for the given product and client' });
    }

    orderData['Total Price'] = parseFloat(orderData['Order Qty']) * price['Price Unit (HT)'];

    const order = await Order.create(orderData);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ message: 'Error creating order', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (id === 'bulk-update') {
      const { orderIds, ...updateFields } = updateData;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: 'orderIds must be a non-empty array for bulk update' });
      }

      // Calculate Total Price for each order
      const orders = await Order.findAll({ where: { id: { [Op.in]: orderIds } } });
      const updatedOrders = await Promise.all(orders.map(async (order) => {
        const price = await Price.findOne({
          where: {
            'Ship to SAP': updateFields['Ship To Party'] || order['Ship To Party'],
            'SAP material': updateFields['Material Code'] || order['Material Code']
          }
        });

        if (!price) {
          throw new Error(`No price found for order ${order.id}`);
        }

        const newTotalPrice = parseFloat(updateFields['Order Qty'] || order['Order Qty']) * price['Price Unit (HT)'];
        return {
          ...order.toJSON(),
          ...updateFields,
          'Total Price': newTotalPrice
        };
      }));

      const [updatedCount] = await Order.bulkCreate(updatedOrders, {
        updateOnDuplicate: Object.keys(updateFields).concat(['Total Price'])
      });

      return res.json({ message: `${updatedCount} orders updated successfully` });
    } else {
      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Calculate new Total Price
      const price = await Price.findOne({
        where: {
          'Ship to SAP': updateData['Ship To Party'] || order['Ship To Party'],
          'SAP material': updateData['Material Code'] || order['Material Code']
        }
      });

      if (!price) {
        return res.status(400).json({ message: 'No price found for the given product and client' });
      }

      const newTotalPrice = parseFloat(updateData['Order Qty'] || order['Order Qty']) * price['Price Unit (HT)'];
      updateData['Total Price'] = newTotalPrice;

      await order.update(updateData);
      return res.json(order);
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order) {
      await order.destroy();
      res.json({ message: 'Order deleted successfully' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};

exports.deleteMultipleOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;
    await Order.destroy({ where: { id: orderIds } });
    res.status(200).json({ message: 'Orders deleted successfully' });
  } catch (error) {
    console.error('Error deleting multiple orders:', error);
    res.status(500).json({ message: 'Error deleting orders', error: error.message });
  }
};

exports.createMultipleOrders = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ordersData = req.body;
    console.log('Received orders data:', JSON.stringify(ordersData, null, 2));
    
    const createdOrders = [];
    const errors = [];
    const uniqueSalesOrders = new Set();

    // Group orders by Sales Order
    const orderGroups = ordersData.reduce((acc, order) => {
      if (!acc[order['Sales Order']]) {
        acc[order['Sales Order']] = [];
      }
      acc[order['Sales Order']].push(order);
      return acc;
    }, {});

    for (const [salesOrder, orders] of Object.entries(orderGroups)) {
      try {
        let newSalesOrderNumber = parseInt(salesOrder, 10);
        if (isNaN(newSalesOrderNumber)) {
          const latestOrder = await Order.findOne({
            order: [['Sales Order', 'DESC']],
            attributes: ['Sales Order'],
            transaction: t
          });
          newSalesOrderNumber = latestOrder ? latestOrder['Sales Order'] + 1 : 1;
        }

        for (let [index, orderData] of orders.entries()) {
          let client, plant, product, price;
          const isZCON = orderData['Order Type'] === 'ZCON';

          if (isZCON) {
            const plantCode = orderData.Customer.startsWith('CP') 
              ? orderData.Customer.slice(2) 
              : orderData.Customer;
            
            plant = await Plant.findOne({
              where: { 'Plant Code': plantCode },
              transaction: t
            });

            if (!plant) {
              throw new Error(`Plant with code ${plantCode} not found`);
            }

            orderData.Customer = `CP${plant['Plant Code']}`;
            orderData['Customer Name'] = plant.Description;
            orderData['Ship To Party'] = `CP${plant['Plant Code']}`;
            orderData['Ship To Name'] = plant.Description;
            orderData['City(Ship To)'] = 'Casablanca';
          } else {
            client = await Client.findOne({
              where: { 'Customer Sold to': orderData.Customer },
              transaction: t
            });

            if (!client) {
              throw new Error(`Client with reference ${orderData.Customer} not found`);
            }
          }

          plant = await Plant.findOne({ 
            where: { 'Plant Code': orderData.Plant },
            transaction: t
          });

          if (!plant) {
            throw new Error(`Plant with code ${orderData.Plant} not found`);
          }

          product = await Product.findOne({
            where: { Material: orderData['Material Code'] },
            transaction: t
          });

          if (!product) {
            throw new Error(`Product with code ${orderData['Material Code']} not found`);
          }

          let totalPrice = 0;
          if (!isZCON) {
            price = await Price.findOne({
              where: {
                'Ship to SAP': orderData['Ship To Party'],
                'SAP material': orderData['Material Code']
              },
              transaction: t
            });

            if (!price) {
              throw new Error(`No price found for product ${orderData['Material Code']} and client ${orderData['Ship To Party']}`);
            }

            totalPrice = parseFloat(orderData['Order Qty']) * price['Price Unit (HT)'];
          }

          const existingOrder = await Order.findOne({
            where: {
              'Sales Order': newSalesOrderNumber,
              'Item': index + 1
            },
            transaction: t
          });

          if (!existingOrder) {
            const preparedOrderData = {
              ...orderData,
              'Sales Order': newSalesOrderNumber,
              'Plant Name': plant.Description,
              status: 'Created',
              'Total Price': totalPrice,
              Item: index + 1
            };

            console.log('Prepared order data:', JSON.stringify(preparedOrderData, null, 2));
            const newOrder = await Order.create(preparedOrderData, { transaction: t });
            console.log('Created order:', JSON.stringify(newOrder, null, 2));
            
            createdOrders.push(newOrder);
          } else {
            console.log(`Order with Sales Order ${newSalesOrderNumber} and Item ${index + 1} already exists. Skipping.`);
          }
        }
        
        uniqueSalesOrders.add(newSalesOrderNumber);
      } catch (error) {
        console.error('Error processing Sales Order:', error);
        errors.push({ salesOrder, error: error.message, stack: error.stack });
      }
    }

    if (errors.length === 0) {
      await t.commit();
      res.status(200).json({
        message: 'Orders created successfully',
        createdOrders,
        totalOrdersCount: createdOrders.length,
        uniqueSalesOrdersCount: uniqueSalesOrders.size
      });
    } else {
      await t.rollback();
      console.error('Errors occurred while processing orders:', JSON.stringify(errors, null, 2));
      res.status(400).json({
        message: 'Error processing orders',
        errors,
        totalOrdersCount: 0,
        uniqueSalesOrdersCount: 0
      });
    }
  } catch (error) {
    await t.rollback();
    console.error('Error in createMultipleOrders:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error processing orders', 
      error: error.message,
      stack: error.stack,
      totalOrdersCount: 0,
      uniqueSalesOrdersCount: 0
    });
  }
};

exports.getLatestSalesOrder = async (req, res) => {
  try {
    const latestOrder = await Order.findOne({
      order: [['Sales Order', 'DESC']],
      attributes: ['Sales Order']
    });

    let latestSalesOrder = 0;
    if (latestOrder && latestOrder['Sales Order']) {
      latestSalesOrder = parseInt(latestOrder['Sales Order'], 10);
      if (isNaN(latestSalesOrder)) {
        latestSalesOrder = 0;
      }
    }

    res.json(latestSalesOrder);
  } catch (error) {
    console.error('Error fetching latest sales order:', error);
    res.status(500).json({ message: 'Error fetching latest sales order', error: error.message });
  }
};

exports.importOrders = async (req, res) => {
  let t;
  try {
    const ordersData = req.body;
    let ordersCreated = 0;
    let tripsCreated = 0;
    let skippedRows = 0;
    let errors = [];
    
    const parseDateSafely = (dateValue) => {
      if (!dateValue) return null;
      
      if (typeof dateValue === 'number') {
        return moment(new Date((dateValue - (25567 + 2)) * 86400 * 1000)).format('YYYY-MM-DD');
      }
      
      const parsedDate = moment(dateValue, [
        moment.ISO_8601,
        'YYYY-MM-DD',
        'DD-MM-YYYY',
        'MM/DD/YYYY',
        'DD/MM/YYYY',
        'DD.MM.YYYY'
      ], true);

      return parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD') : null;
    };

  const ordersByTrip = ordersData.reduce((acc, order) => {
    const tripNum = order['Trip Num'] ? String(order['Trip Num']).replace(/^0+/, '') : null;
    if (tripNum) {
      if (!acc[tripNum]) {
        acc[tripNum] = [];
      }
      acc[tripNum].push(order);
    }
    return acc;
  }, {});

  for (const [tripNum, tripOrders] of Object.entries(ordersByTrip)) {
    t = await sequelize.transaction();
    try {
      let trip;
      const tourStartDate = parseDateSafely(tripOrders[0]['Tour Start Date']);
      const requestedDeliveryDate = parseDateSafely(tripOrders[0]['Requested delivery date']);

      [trip] = await Trip.findOrCreate({
        where: { "Trip Num": parseInt(tripNum) },
        defaults: {
          "Trip Num": parseInt(tripNum),
          "Tour Start Date": tourStartDate,
          "Requested delivery date": requestedDeliveryDate,
          "Vehicle Id": tripOrders[0]['Vehicle Id'],
          "Order Qty": 0,
          "Status": 'In Progress',
          sealnumbers: [],
          totalorders: [],
          uniquesalesorders: []
        },
        transaction: t
      });

      let totalOrderQty = 0;
      const uniqueSalesOrdersMap = new Map();
      const createdOrders = [];

      for (const orderData of tripOrders) {
        const isZCON = orderData['Order Type'] === 'ZCON';
        const materialCode = orderData['Material Code'] ? String(orderData['Material Code']).replace(/^0+/, '') : null;
        const patDoc = orderData['Pat.Doc'] ? String(orderData['Pat.Doc']).replace(/^0+/, '') : null;

        let shipToParty, customerName, shipToName, city;

        if (isZCON) {
          const plantCode = orderData['Customer'].startsWith('CP') 
            ? orderData['Customer'].slice(2) 
            : orderData['Customer'];
          
          const plant = await Plant.findOne({
            where: { 'Plant Code': plantCode },
            transaction: t
          });

          if (!plant) {
            throw new Error(`Plant with code ${plantCode} not found for ZCON order`);
          }

          shipToParty = `CP${plantCode}`;
          customerName = plant.Description;
          shipToName = plant.Description;
          city = 'Casablanca';
        } else {
          shipToParty = String(orderData['Ship To Party']);
          customerName = orderData['Customer Name'];
          shipToName = orderData['Ship To Name'];
          city = orderData['City(Ship To)'];
        }

        const price = isZCON ? null : await Price.findOne({
          where: {
            'Ship to SAP': shipToParty,
            'SAP material': materialCode
          },
          transaction: t
        });

        if (!isZCON && !price) {
          throw new Error(`No price found for product ${materialCode} and client ${shipToParty}`);
        }

        const totalPrice = isZCON ? 0 : parseFloat(orderData['Order Qty']) * price['Price Unit (HT)'];

        const product = await Product.findOne({ where: { Material: materialCode }, transaction: t });
        let orderType = 'VRAC';

        if (product && product['DF at client level'] && product['DF at client level'].toLowerCase().includes('pack')) {
          orderType = 'PACK';
        }

        const newOrder = await Order.create({
          "Sales Order": orderData['Sales Order'],
          "Order Type": orderData['Order Type'],
          "Customer": isZCON ? shipToParty : orderData['Customer'],
          "Customer Name": customerName,
          "Plant": orderData['Plant'],
          "Plant Name": orderData['Plant Name'],
          "Ship To Party": shipToParty,
          "Ship To Name": shipToName,
          "Valution Type": orderData['Valution Type'],
          "City(Ship To)": city,
          "Item": orderData['Item'],
          "Material Code": materialCode,
          "Material Name": orderData['Material Name'],
          "Order Qty": parseFloat(orderData['Order Qty']),
          "Sls.UOM": orderData['Sls.UOM'],
          "Requested delivery date": requestedDeliveryDate,
          "Pat.Doc": patDoc,
          "Trip Num": trip.id,
          "Tour Start Date": tourStartDate,
          "Org Name": orderData['Org Name'],
          "Driver Name": orderData['Driver Name'],
          "Vehicle Id": orderData['Vehicle Id'],
          "status": 'Truck Loading Confirmation',
          "order_type": orderType,
          "Total Price": totalPrice
        }, { transaction: t });

        totalOrderQty += parseFloat(orderData['Order Qty']);
        createdOrders.push(newOrder);
        
        if (!uniqueSalesOrdersMap.has(newOrder['Sales Order'])) {
          uniqueSalesOrdersMap.set(newOrder['Sales Order'], newOrder);
        }

        ordersCreated++;
      }

      await trip.update({
        "Order Qty": totalOrderQty,
        totalorders: createdOrders,
        uniquesalesorders: Array.from(uniqueSalesOrdersMap.values())
      }, { transaction: t });

      await t.commit();
      tripsCreated++;
    } catch (error) {
      await t.rollback();
      console.error('Error creating trip and orders:', error);
      errors.push({ trip: tripNum, error: error.message });
      skippedRows += tripOrders.length;
    }
  }

    res.status(200).json({
      message: 'Import completed',
      ordersCreated,
      tripsCreated,
      skippedRows,
      errors
    });
  } catch (error) {
    if (t) await t.rollback();
    console.error('Error importing orders:', error);
    res.status(500).json({ error: 'An error occurred during import' });
  }
};

exports.autoSaveOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const orderData = req.body;
    const salesOrder = parseInt(orderData['Sales Order']);

    // Calculate Total Price
    const price = await Price.findOne({
      where: {
        'Ship to SAP': orderData['Ship To Party'],
        'SAP material': orderData['Material Code']
      },
      transaction: t
    });

    if (!price) {
      throw new Error('No price found for the given product and client');
    }

    const totalPrice = parseFloat(orderData['Order Qty']) * price['Price Unit (HT)'];

    const [order, created] = await Order.findOrCreate({
      where: { 'Sales Order': salesOrder },
      defaults: {
        ...orderData,
        'Sales Order': salesOrder,
        'Order Qty': parseFloat(orderData['Order Qty']),
        'Item': parseInt(orderData['Item'], 10),
        'Trip Num': orderData['Trip Num'] ? parseInt(orderData['Trip Num']) : null,
        'Total Price': totalPrice
      },
      transaction: t
    });

    if (!created) {
      await order.update({
        ...orderData,
        'Sales Order': salesOrder,
        'Order Qty': parseFloat(orderData['Order Qty']),
        'Item': parseInt(orderData['Item'], 10),
        'Trip Num': orderData['Trip Num'] ? parseInt(orderData['Trip Num']) : null,
        'Total Price': totalPrice
      }, { transaction: t });
    }

    await t.commit();
    res.json(order);
  } catch (error) {
    await t.rollback();
    console.error('Error auto-saving order:', error);
    res.status(400).json({ message: 'Error auto-saving order', error: error.message });
  }
};

module.exports = {
  getOrders: exports.getOrders,
  getOrderById: exports.getOrderById,
  createOrder: exports.createOrder,
  updateOrder: exports.updateOrder,
  deleteOrder: exports.deleteOrder,
  deleteMultipleOrders: exports.deleteMultipleOrders,
  createMultipleOrders: exports.createMultipleOrders,
  getLatestSalesOrder: exports.getLatestSalesOrder,
  importOrders: exports.importOrders,
  autoSaveOrder: exports.autoSaveOrder,
  getAllOrders: exports.getAllOrders,
};