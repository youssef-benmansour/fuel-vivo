const { sequelize, Trip, Order, Client, Truck, Product, Plant } = require('../models');
const { Op } = require('sequelize');
const { numberToWords } = require('../utils/numberToWords'); // Assume this utility function exists

exports.createTrip = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { tourStartDate, vehicleId, orderIds, status, orgName, driverName, driverCIN } = req.body;

    if (!tourStartDate || !vehicleId || !orderIds || orderIds.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const orders = await Order.findAll({
      where: { id: { [Op.in]: orderIds } },
      transaction: t
    });

    if (orders.length !== orderIds.length) {
      const foundOrderIds = orders.map(order => order.id);
      const missingOrderIds = orderIds.filter(id => !foundOrderIds.includes(id));
      throw new Error(`Some orders were not found. Missing order IDs: ${missingOrderIds.join(', ')}`);
    }

    const totalOrderQty = orders.reduce((sum, order) => sum + parseFloat(order['Order Qty'] || 0), 0);
    const uniqueSalesOrdersMap = new Map();

    orders.forEach(order => {
      if (!uniqueSalesOrdersMap.has(order['Sales Order'])) {
        uniqueSalesOrdersMap.set(order['Sales Order'], order);
      }
    });

    const trip = await Trip.create({
      "Tour Start Date": tourStartDate,
      "Requested delivery date": tourStartDate,
      "Vehicle Id": vehicleId,
      "Order Qty": totalOrderQty,
      "Status": status || 'In Progress',
      sealnumbers: [],
      totalorders: orders,
      uniquesalesorders: Array.from(uniqueSalesOrdersMap.values()),
      "Driver Name": driverName,
      "Driver CIN": driverCIN
    }, { transaction: t });

    // Update the Trip Num to match the auto-generated id
    await trip.update({ "Trip Num": trip.id }, { transaction: t });

    // Update associated orders
    await Order.update(
      {
        "Trip Num": trip.id,
        "Tour Start Date": tourStartDate,
        "Vehicle Id": vehicleId,
        "status": 'Truck Loading Confirmation',
        "Org Name": orgName,
        "Driver Name": driverName
      },
      { 
        where: { id: { [Op.in]: orderIds } },
        transaction: t
      }
    );

    const truck = await Truck.findByPk(vehicleId, { transaction: t });

    await t.commit();
    res.status(201).json({ 
      trip: {
        ...trip.toJSON(),
        Truck: truck,
        totalOrdersCount: orders.length,
        uniqueSalesOrdersCount: uniqueSalesOrdersMap.size
      },
      updatedOrdersCount: orders.length
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating trip:', error);
    res.status(500).json({ 
      message: 'Error creating trip', 
      error: error.message,
      details: error.stack
    });
  }
};

exports.getAllTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: trips } = await Trip.findAndCountAll({
      include: [
        { 
          model: Truck, 
          as: 'Truck',
          attributes: ['Vehicle', 'Haulier name', 'Driver name']
        }
      ],
      distinct: true,
      limit,
      offset,
      order: [['Trip Num', 'DESC']]
    });

    const processedTrips = trips.map(trip => {
      const plainTrip = trip.get({ plain: true });
      return {
        ...plainTrip,
        totalOrderQty: plainTrip['Order Qty'],
        totalOrdersCount: plainTrip.totalorders.length,
        uniqueSalesOrdersCount: plainTrip.uniquesalesorders.length
      };
    });

    res.json({
      trips: processedTrips,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ message: 'Error fetching trips', error: error.message });
  }
};

exports.updateTrip = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const tripId = req.params.id;
    const updateData = req.body;

    console.log(`Updating trip with ID: ${tripId}`, updateData);

    const trip = await Trip.findByPk(tripId, { transaction: t });
    if (!trip) {
      console.log(`Trip not found: ${tripId}`);
      await t.rollback();
      return res.status(404).json({ message: 'Trip not found' });
    }

    // If updating orders, recalculate totalOrders and uniqueSalesOrders
    if (updateData.orderIds) {
      const orders = await Order.findAll({
        where: { id: { [Op.in]: updateData.orderIds } },
        include: [
          { model: Client, as: 'CustomerInfo' },
          { model: Client, as: 'ShipToInfo' },
          { model: Product, as: 'Product' },
          { model: Plant, as: 'PlantInfo' }
        ],
        transaction: t
      });

      const uniqueSalesOrdersMap = new Map();
      orders.forEach(order => {
        if (!uniqueSalesOrdersMap.has(order['Sales Order'])) {
          uniqueSalesOrdersMap.set(order['Sales Order'], order);
        }
      });

      updateData.totalorders = orders;
      updateData.uniquesalesorders = Array.from(uniqueSalesOrdersMap.values());
      updateData['Order Qty'] = orders.reduce((sum, order) => sum + parseFloat(order['Order Qty'] || 0), 0);
    }

    // Update sealnumbers if provided
    if (updateData.sealnumbers) {
      updateData.sealnumbers = updateData.sealnumbers.filter(seal => seal !== null && seal !== '');
    }

    await trip.update(updateData, { transaction: t });

    if (updateData.orderIds) {
      await Order.update(
        {
          "Trip Num": tripId,
          "Tour Start Date": updateData['Tour Start Date'],
          "Vehicle Id": updateData['Vehicle Id'],
          "status": 'Truck Loading Confirmation'
        },
        { 
          where: { id: { [Op.in]: updateData.orderIds } },
          transaction: t
        }
      );
    }

    await t.commit();
    
    const updatedTrip = await Trip.findByPk(tripId, {
      include: [
        { model: Order, as: 'Orders' },
        { model: Order, as: 'uniquesalesorders' }
      ]
    });

    console.log(`Trip updated successfully: ${tripId}`);
    res.json({
      ...updatedTrip.toJSON(),
      totalOrdersCount: updatedTrip.Orders.length,
      uniqueSalesOrdersCount: updatedTrip.uniquesalesorders.length
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating trip:', error);
    res.status(500).json({ message: 'Error updating trip', error: error.message });
  }
};

exports.deleteTrip = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const tripId = req.params.id;
    const trip = await Trip.findByPk(tripId, { transaction: t });
    
    if (!trip) {
      await t.rollback();
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Reset orders associated with this trip
    await Order.update(
      {
        "Trip Num": null,
        "Tour Start Date": null,
        "Vehicle Id": null,
        "Org Name": null,
        "Driver Name": null,
        "status": 'Created'
      },
      { 
        where: { "Trip Num": tripId },
        transaction: t
      }
    );

    await trip.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting trip:', error);
    res.status(500).json({ message: 'Error deleting trip', error: error.message });
  }
};


exports.getTripById = async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findOne({
      where: { 'Trip Num': tripId },
      include: [
        { 
          model: Truck, 
          as: 'Truck',
          attributes: ['Vehicle', 'Trailer Number', 'Haulier name', 'Driver name', 'Driver CIN', 'Vehicule Capacity', 'MPGI', 'Seals', 'Vehicle-Type']
        }
      ]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Extract unique order IDs from totalorders
    const orderIds = [...new Set(trip.totalorders.map(order => order.id))];

    // Fetch orders with all necessary information
    const orders = await Order.findAll({
      where: { id: { [Op.in]: orderIds } },
      include: [
        { 
          model: Client, 
          as: 'CustomerInfo',
          attributes: ['Customer Sold to', 'Customer Sold to name', 'Statut de droit', 'Statut de droit name', 'Customer ship to Address', 'Customer ship to city', 'ICE', 'ID Fiscal', 'Paiement terms']
        },
        { 
          model: Client, 
          as: 'ShipToInfo',
          attributes: ['Customer Ship to', 'Customer ship to name', 'Customer ship to city']
        },
        {
          model: Plant,
          as: 'PlantInfo',
          attributes: ['Plant Code', 'Description']
        },
        {
          model: Product,
          as: 'Product',
          attributes: ['Material', 'Material description', 'Base Unit of Measure', 'density', 'temp', 'Tax']
        }
      ]
    });

    // Calculate total amount and VAT
    const totalAmount = orders.reduce((sum, order) => sum + order['Total Price'], 0);
    const vatRate = orders[0].Product.Tax; // Tax is already in percentage
    const vatAmount = totalAmount * (vatRate / 100);
    const totalWithVat = totalAmount + vatAmount;

    // Use a Map to ensure unique orders based on their ID
    const uniqueOrdersMap = new Map();
    orders.forEach(order => {
      uniqueOrdersMap.set(order.id, order);
    });

    const uniqueOrders = Array.from(uniqueOrdersMap.values());

    const result = {
      ...trip.toJSON(),
      Orders: uniqueOrders,
      totalOrdersCount: uniqueOrders.length,
      uniqueSalesOrdersCount: new Set(uniqueOrders.map(order => order['Sales Order'])).size,
      invoiceDetails: {
        totalAmount,
        vatRate,
        vatAmount,
        totalWithVat,
        totalInWords: numberToWords(totalWithVat).toUpperCase()
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching trip by ID:', error);
    res.status(500).json({ 
      message: 'Error fetching trip', 
      error: error.message,
      stack: error.stack
    });
  }
};

exports.getTripDetails = async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findOne({
      where: { 'Trip Num': tripId },
      include: [
        { 
          model: Truck, 
          as: 'Truck',
          attributes: ['Vehicle', 'Trailer Number', 'Haulier name', 'Driver name', 'Driver CIN', 'Vehicule Capacity', 'MPGI', 'Seals', 'Vehicle-Type']
        },
        {
          model: Order,
          as: 'Orders',
          include: [
            { 
              model: Client, 
              as: 'CustomerInfo',
              attributes: ['Customer Sold to', 'Customer Sold to name', 'Statut de droit', 'Statut de droit name', 'Customer ship to Address', 'Customer ship to city', 'ICE']
            },
            { 
              model: Client, 
              as: 'ShipToInfo',
              attributes: ['Customer Ship to', 'Customer ship to name', 'Customer ship to city', 'Customer ship to Address']
            },
            {
              model: Plant,
              as: 'PlantInfo',
              attributes: ['Plant Code', 'Description']
            },
            {
              model: Product,
              as: 'Product',
              attributes: ['Material', 'Base Unit of Measure', 'density', 'temp']
            }
          ]
        }
      ]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const result = {
      ...trip.toJSON(),
      totalOrdersCount: trip.Orders.length,
      uniqueSalesOrdersCount: new Set(trip.Orders.map(order => order['Sales Order'])).size
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).json({ 
      message: 'Error fetching trip details', 
      error: error.message,
      stack: error.stack
    });
  }
};

exports.updateTripLoading = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const tripId = req.params.id;
    const { Status, sealnumbers } = req.body;

    console.log(`Updating trip loading status for trip ID: ${tripId}`, { Status, sealnumbers });

    const trip = await Trip.findByPk(tripId, { transaction });

    if (!trip) {
      console.log(`Trip not found: ${tripId}`);
      await transaction.rollback();
      return res.status(404).json({ message: 'Trip not found' });
    }

    console.log('Found trip:', JSON.stringify(trip, null, 2));

    // Get the current max values for NumLivraison and NumFacture
    const maxValues = await Trip.findOne({
      attributes: [
        [sequelize.fn('MAX', sequelize.col('numlivraison')), 'maxnumlivraison'],
        [sequelize.fn('MAX', sequelize.col('numfacture')), 'maxnumfacture']
      ],
      transaction
    });

    const newNumLivraison = (maxValues.get('maxnumlivraison') || 14614) + 1;
    const newNumFacture = (maxValues.get('maxnumfacture') || 39123) + 1;

    // Update trip status, seal numbers, and increment NumLivraison and NumFacture
    await trip.update({ 
      Status, 
      sealnumbers: sealnumbers.filter(seal => seal !== null && seal !== ''),
      numlivraison: newNumLivraison,
      numfacture: newNumFacture
    }, { transaction });

    console.log('Trip updated successfully');

    // Update associated orders
    const orderIds = trip.totalorders ? trip.totalorders.map(order => order.id) : [];
    console.log(`Order IDs found in totalorders: ${orderIds.join(', ')}`);

    if (orderIds.length > 0) {
      const updateResult = await Order.update(
        { status: Status },
        { 
          where: { id: { [Op.in]: orderIds } },
          transaction
        }
      );
      console.log(`Orders updated: ${updateResult[0]}`);
    } else {
      console.log('No orders found in totalorders');
    }

    // Update the totalorders field with the new status
    if (trip.totalorders) {
      trip.totalorders = trip.totalorders.map(order => ({
        ...order,
        status: Status
      }));
      await trip.save({ transaction });
    }

    await transaction.commit();
    console.log('Transaction committed successfully');
    
    // Fetch the updated trip
    const updatedTrip = await Trip.findByPk(tripId);

    console.log(`Trip loading status updated successfully: ${tripId}`);
    res.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip loading status:', error);
    console.error('Error stack:', error.stack);
    
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    res.status(500).json({ 
      message: 'Error updating trip loading status', 
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  createTrip: exports.createTrip,
  getAllTrips: exports.getAllTrips,
  updateTrip: exports.updateTrip,
  deleteTrip: exports.deleteTrip,
  getTripById: exports.getTripById,
  getTripDetails: exports.getTripDetails,
  updateTripLoading: exports.updateTripLoading,
}