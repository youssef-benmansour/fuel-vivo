const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.get('/prices', dataController.getAllPrices);
router.get('/plants', dataController.getAllPlants);
router.get('/products', dataController.getAllProducts);
router.get('/clients', dataController.getAllClients);
router.get('/tanks', dataController.getAllTanks);
router.get('/trucks', dataController.getAllTrucks);
router.put('/products/:id', dataController.updateProduct);

module.exports = router;