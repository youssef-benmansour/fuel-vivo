const { Price, Plant, Product, Client, Tank, Truck } = require('../models');

const getAllPrices = async (req, res) => {
  try {
    const prices = await Price.findAll();
    res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ message: 'Error fetching prices', error: error.message });
  }
};

const getAllPlants = async (req, res) => {
  try {
    const plants = await Plant.findAll();
    res.json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ message: 'Error fetching plants', error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

const getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

const getAllTanks = async (req, res) => {
  try {
    const tanks = await Tank.findAll();
    res.json(tanks);
  } catch (error) {
    console.error('Error fetching tanks:', error);
    res.status(500).json({ message: 'Error fetching tanks', error: error.message });
  }
};

const getAllTrucks = async (req, res) => {
  try {
    let { attributes } = req.query;
    let queryOptions = {};

    if (attributes) {
      if (typeof attributes === 'string') {
        attributes = attributes.split(',');
      }
      attributes = attributes.filter(attr => attr !== 'id');
      
      if (attributes.length > 0) {
        queryOptions.attributes = attributes;
      }
    }

    const trucks = await Truck.findAll(queryOptions);
    res.json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ message: 'Error fetching trucks', error: error.message });
  }
};

const updateProduct = async (req, res) => {
    try {
      const productId = req.params.id;
      const { density, temp, type } = req.body;
  
      const product = await Product.findByPk(productId);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      await product.update({ density, temp, type });
  
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error updating product', error: error.message });
    }
  };

module.exports = {
  getAllPrices,
  getAllPlants,
  getAllProducts,
  getAllClients,
  getAllTanks,
  getAllTrucks,
  updateProduct
};