const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Get all orders
router.get('/', orderController.getOrders);

// Get the latest sales order number
router.get('/latest-sales-order', orderController.getLatestSalesOrder);

// Create a new order
router.post('/', orderController.createOrder);

// Create multiple orders
router.post('/create-multiple', orderController.createMultipleOrders);

// Update an order
router.put('/:id', orderController.updateOrder);

// Delete an order
router.delete('/:id', orderController.deleteOrder);

// Delete multiple orders
router.post('/delete-multiple', orderController.deleteMultipleOrders);

// Import orders
router.post('/import', orderController.importOrders);

// Auto-save order
router.post('/auto-save', orderController.autoSaveOrder);

// Get order by ID (place this route last to avoid conflicts)
router.get('/:id', orderController.getOrderById);


module.exports = router;