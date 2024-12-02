import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileUp, Edit, Trash2, Search, RefreshCw, Eye, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import OrderForm from '../components/Orders/OrderForm';
import OrderImport from '../components/Orders/OrderImport';
import { getOrders, deleteOrder, deleteMultipleOrders, getOrderById } from '../services/api';
import { Table, Button, Card, Input, Select, DatePicker, Tooltip, Modal, message, Popconfirm, Space } from 'antd';
import { useTheme } from '../context/ThemeContext';
import '../styles/orderManagement.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    orderType: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const { theme } = useTheme();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders(filters);
      const processedOrders = processOrders(response.data);
      setOrders(processedOrders);
      setTotalOrders(processedOrders.length);
      showToast('Orders loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load orders. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const processOrders = (ordersData) => {
    const orderMap = new Map();
    ordersData.forEach(order => {
      const salesOrder = order['Sales Order'];
      if (!orderMap.has(salesOrder)) {
        orderMap.set(salesOrder, {
          id: salesOrder,
          'Sales Order': salesOrder,
          'Customer Name': order['Customer Name'],
          'Order Type': order['Order Type'],
          status: order.status,
          totalQuantity: 0,
          subOrders: []
        });
      }
      const groupedOrder = orderMap.get(salesOrder);
      // Check if this specific sub-order already exists
      const existingSubOrder = groupedOrder.subOrders.find(so => so.Item === order.Item);
      if (!existingSubOrder) {
        groupedOrder.subOrders.push(order);
        groupedOrder.totalQuantity += parseFloat(order['Order Qty'] || 0);
      }
    });
  
    return Array.from(orderMap.values());
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      orderType: '',
    });
    setCurrentPage(1);
  };

  const handleDelete = async (orderIds) => {
    if (window.confirm(`Are you sure you want to delete ${orderIds.length} order(s)?`)) {
      try {
        if (orderIds.length === 1) {
          await deleteOrder(orderIds[0]);
        } else {
          await deleteMultipleOrders(orderIds);
        }
        showToast(`${orderIds.length} order(s) deleted successfully`, 'success');
        fetchOrders();
        setSelectedOrders([]);
      } catch (error) {
        console.error('Error deleting orders:', error);
        showToast('Failed to delete orders. Please try again.', 'error');
      }
    }
  };

  const handleEdit = async (salesOrder, item) => {
    try {
      const orderToEdit = orders.find(o => o.id === salesOrder)?.subOrders.find(so => so.Item === item);
      if (orderToEdit) {
        setEditingOrder(orderToEdit);
        setShowOrderForm(true);
      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      console.error('Error in handleEdit:', error);
      showToast('Failed to fetch order details. Please try again.', 'error');
    }
  };

  const handleView = async (salesOrder, item) => {
    try {
      const orderToView = orders.find(o => o.id === salesOrder)?.subOrders.find(so => so.Item === item);
      if (orderToView) {
        setViewingOrder(orderToView);
        setShowOrderForm(true);
      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      console.error('Error in handleView:', error);
      showToast('Failed to fetch order details. Please try again.', 'error');
    }
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setViewingOrder(null);
    setShowOrderForm(true);
  };

  const handleOrderSave = (result) => {
    setShowOrderForm(false);
    setEditingOrder(null);
    setViewingOrder(null);
    fetchOrders();
    if (Array.isArray(result.createdOrders)) {
      showToast(`${result.createdOrders.length} new order(s) created successfully`, 'success');
    } else {
      showToast('Order updated successfully', 'success');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const columns = [
    {
      title: 'Sales Order',
      dataIndex: 'Sales Order',
      key: 'salesOrder',
      sorter: (a, b) => a['Sales Order'] - b['Sales Order'],
    },
    {
      title: 'Customer',
      dataIndex: 'Customer Name',
      key: 'customer',
      sorter: (a, b) => a['Customer Name'].localeCompare(b['Customer Name']),
    },
    {
      title: 'Order Type',
      dataIndex: 'Order Type',
      key: 'orderType',
      sorter: (a, b) => a['Order Type'].localeCompare(b['Order Type']),
    },
    {
      title: 'Total Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
      render: (value) => value.toFixed(2),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
          {status}
        </span>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
  ];

  const expandedRowRender = (record) => {
    const subColumns = [
      { title: 'Item', dataIndex: 'Item', key: 'item' },
      { title: 'Material', dataIndex: 'Material Code', key: 'material' },
      { title: 'Description', dataIndex: 'Material Name', key: 'description' },
      { 
        title: 'Quantity', 
        dataIndex: 'Order Qty', 
        key: 'quantity',
        render: (text) => parseFloat(text).toFixed(2)
      },
      { title: 'UOM', dataIndex: 'Sls.UOM', key: 'uom' },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, subRecord) => (
          <Space size="small">
            <Button icon={<Eye />} onClick={() => handleView(record['Sales Order'], subRecord.Item)} />
            <Button icon={<Edit />} onClick={() => handleEdit(record['Sales Order'], subRecord.Item)} />
          </Space>
        ),
      },
    ];
  
    return (
      <Table
        columns={subColumns}
        dataSource={record.subOrders}
        pagination={false}
        rowKey={(item) => `${record['Sales Order']}-${item.Item}`}
      />
    );
  };

  return (
    <div className={`order-management ${theme}`}>
      <Card title="Order Management" className="main-card">
        {/* Toolbar */}
        <div className="toolbar">
          <Input.Search
            placeholder="Search orders..."
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <div className="actions">
            <Button 
              icon={<Filter />} 
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button type="primary" icon={<Plus />} onClick={handleNewOrder}>
              New Order
            </Button>
            <Button icon={<FileUp />} onClick={() => setShowImportForm(true)}>
              Import
            </Button>
            <Button icon={<RefreshCw />} onClick={fetchOrders}>
              Refresh
            </Button>
            <Popconfirm
              title={`Are you sure you want to delete ${selectedOrders.length} order(s)?`}
              onConfirm={() => handleDelete(selectedOrders)}
              okText="Yes"
              cancelText="No"
              disabled={selectedOrders.length === 0}
            >
              <Button 
                danger 
                icon={<Trash2 />} 
                disabled={selectedOrders.length === 0}
              >
                Delete ({selectedOrders.length})
              </Button>
            </Popconfirm>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="filters-panel"
            >
              <Select
                style={{ width: 200, marginRight: 16 }}
                placeholder="Status"
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
              >
                <Option value="">All</Option>
                <Option value="Created">Created</Option>
                <Option value="Truck Loading Confirmation">Truck Loading Confirmation</Option>
                <Option value="Completed">Completed</Option>
              </Select>
              <Select
                style={{ width: 200, marginRight: 16 }}
                placeholder="Order Type"
                value={filters.orderType}
                onChange={(value) => handleFilterChange('orderType', value)}
              >
                <Option value="">All</Option>
                <Option value="ZOR">ZOR</Option>
                <Option value="ZCON">ZCON</Option>
                <Option value="ZOC">ZOC</Option>
                <Option value="SUR1">SUR1</Option>
              </Select>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders Table */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalOrders,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.subOrders && record.subOrders.length > 0,
          }}
        />
      </Card>

      {/* Order Form Modal */}
      <Modal
        title={editingOrder ? 'Edit Order' : (viewingOrder ? 'View Order' : 'New Order')}
        visible={showOrderForm}
        onCancel={() => {
          setShowOrderForm(false);
          setEditingOrder(null);
          setViewingOrder(null);
        }}
        footer={null}
        width={1000}
      >
        <OrderForm
          order={editingOrder || viewingOrder}
          onSave={handleOrderSave}
          onCancel={() => {
            setShowOrderForm(false);
            setEditingOrder(null);
            setViewingOrder(null);
          }}
          isReadOnly={!!viewingOrder}
        />
      </Modal>

      {/* Import Form Modal */}
      <Modal
        title="Import Orders"
        visible={showImportForm}
        onCancel={() => setShowImportForm(false)}
        footer={null}
        width={800}
      >
        <OrderImport
          onImportComplete={() => {
            setShowImportForm(false);
            fetchOrders();
          }}
          onCancel={() => setShowImportForm(false)}
        />
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;