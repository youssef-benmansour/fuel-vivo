const express = require('express');
const orderRoutes = require('./ordersRoutes');
const tripRoutes = require('./tripsRoutes');
const importRoutes = require('./importRoutes');

const router = express.Router();

router.use('/orders', orderRoutes);
router.use('/trips', tripRoutes);
router.use('/import', importRoutes);

module.exports = router;