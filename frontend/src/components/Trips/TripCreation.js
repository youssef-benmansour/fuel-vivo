import React, { useState, useEffect, useMemo } from 'react';
import { Form, Select, DatePicker, Button, Table, message, Space, Modal, Input } from 'antd';
import { createTrip, getOrders, getTrucks } from '../../services/api';

const { Option } = Select;

const TripCreation = ({ onTripCreated }) => {
  const [form] = Form.useForm();
  const [orders, setOrders] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [driverInfo, setDriverInfo] = useState({ cin: '', name: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersResponse, trucksResponse] = await Promise.all([
          getOrders({ status: 'Created' }),
          getTrucks(['id', 'Vehicle', 'MPGI', 'Vehicule Capacity', 'Vehicle-Type', 'Class-Group', 'Haulier name', 'Driver name', 'Driver CIN'])
        ]);
        const processedOrders = processOrders(ordersResponse.data);
        setOrders(processedOrders);
        setTrucks(trucksResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processOrders = (ordersData) => {
    const orderMap = new Map();
    ordersData.forEach(order => {
      if (!order['Trip Num']) {
        const salesOrder = order['Sales Order'];
        if (!orderMap.has(salesOrder)) {
          orderMap.set(salesOrder, {
            key: salesOrder,
            salesOrder: salesOrder,
            customerName: order['Customer Name'],
            totalQuantity: 0,
            requestedDeliveryDate: order['Requested delivery date'],
            orderType: order.order_type,
            subOrders: []
          });
        }
        const groupedOrder = orderMap.get(salesOrder);
        const existingSubOrder = groupedOrder.subOrders.find(so => so.Item === order.Item);
        if (!existingSubOrder) {
          groupedOrder.subOrders.push(order);
          groupedOrder.totalQuantity += parseFloat(order['Order Qty'] || 0);
        }
      }
    });
    return Array.from(orderMap.values());
  };

  const handleOrderSelection = (selectedRowKeys, selectedRows) => {
    const allSelectedOrders = selectedRows.flatMap(row => row.subOrders);
    
    const orderTypes = new Set(selectedRows.map(row => row.orderType));
    if (orderTypes.size > 1) {
      message.error('You cannot mix PACK and VRAC orders in the same trip.');
      return;
    }

    setSelectedOrders(allSelectedOrders);
    updateAvailableTrucks(allSelectedOrders);
  };

  const updateAvailableTrucks = (selectedOrders) => {
    const totalOrderQty = selectedOrders.reduce((sum, order) => sum + parseFloat(order['Order Qty']), 0);
    const orderType = selectedOrders.length > 0 ? selectedOrders[0].order_type : null;

    const availableTrucks = trucks.filter(truck => {
      const isTruckTypeMatching = orderType === 'PACK' 
        ? truck['MPGI'].toLowerCase().includes('packed')
        : !truck['MPGI'].toLowerCase().includes('packed');
      const hasEnoughCapacity = parseFloat(truck['Vehicule Capacity']) >= totalOrderQty;

      return isTruckTypeMatching && hasEnoughCapacity;
    });

    setAvailableTrucks(availableTrucks);
    form.setFieldsValue({ truck: null });
    setSelectedTruck(null);
  };

  const handleTruckSelection = (value) => {
    setSelectedTruck(value);
    const selectedTruckData = trucks.find(truck => truck.Vehicle === value);
    if (selectedTruckData) {
      setDriverInfo({
        cin: selectedTruckData['Driver CIN'] || '',
        name: selectedTruckData['Driver name'] || ''
      });
      form.setFieldsValue({
        driverCIN: selectedTruckData['Driver CIN'] || '',
        driverName: selectedTruckData['Driver name'] || ''
      });
    }
  };

  const handleDriverInfoChange = (field, value) => {
    setDriverInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (values) => {
    if (!selectedTruck || !values.tourStartDate || selectedOrders.length === 0) {
      message.error('Please select a truck, tour start date, and at least one order.');
      return;
    }

    const totalOrderQty = selectedOrders.reduce((sum, order) => sum + parseFloat(order['Order Qty']), 0);
    const selectedTruckData = trucks.find(truck => truck.Vehicle === selectedTruck);
    const selectedTruckCapacity = parseFloat(selectedTruckData['Vehicule Capacity']);

    if (totalOrderQty < selectedTruckCapacity) {
      message.error('The truck must be at 100% capacity before it can be dispatched.');
      return;
    }

    try {
      const formattedDate = values.tourStartDate.format('YYYY-MM-DD');

      const tripData = {
        vehicleId: selectedTruck,
        tourStartDate: formattedDate,
        orderIds: selectedOrders.map(order => order.id),
        status: 'In Progress',
        orderQty: totalOrderQty,
        orgName: selectedTruckData['Haulier name'],
        driverName: values.driverName,
        driverCIN: values.driverCIN
      };

      const createdTrip = await createTrip(tripData);

      message.success('Trip created successfully and orders updated');
      onTripCreated();
      form.resetFields();
      setSelectedOrders([]);
      setSelectedTruck(null);
      setDriverInfo({ cin: '', name: '' });
    } catch (error) {
      console.error('Error creating trip or updating orders:', error);
      message.error('Failed to create trip or update orders');
    }
  };

  const columns = [
    { title: 'Sales Order', dataIndex: 'salesOrder', key: 'salesOrder' },
    { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
    { 
      title: 'Total Quantity', 
      dataIndex: 'totalQuantity', 
      key: 'totalQuantity',
      render: (value) => value.toFixed(2)
    },
    { title: 'Requested Delivery Date', dataIndex: 'requestedDeliveryDate', key: 'requestedDeliveryDate' },
    { title: 'Order Type', dataIndex: 'orderType', key: 'orderType' },
  ];

  const expandedRowRender = (record) => {
    const subColumns = [
      { title: 'Item', dataIndex: 'Item', key: 'item' },
      { title: 'Material Code', dataIndex: 'Material Code', key: 'materialCode' },
      { title: 'Material Name', dataIndex: 'Material Name', key: 'materialName' },
      { title: 'Valuation Type', dataIndex: 'Valution Type', key: 'valuationType' },
      { 
        title: 'Quantity', 
        dataIndex: 'Order Qty', 
        key: 'quantity',
        render: (value) => parseFloat(value).toFixed(2)
      },
      { title: 'UOM', dataIndex: 'Sls.UOM', key: 'uom' },
    ];

    return (
      <Table
        columns={subColumns}
        dataSource={record.subOrders}
        pagination={false}
        rowKey={(item) => `${record.salesOrder}-${item.Item}`}
      />
    );
  };

  const calculateTruckUtilization = () => {
    if (!selectedTruck || selectedOrders.length === 0) return 0;
    const totalOrderQty = selectedOrders.reduce((sum, order) => sum + parseFloat(order['Order Qty']), 0);
    const truckCapacity = trucks.find(truck => truck.Vehicle === selectedTruck)['Vehicule Capacity'];
    return (totalOrderQty / truckCapacity) * 100;
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Table
        rowSelection={{
          type: 'checkbox',
          onChange: handleOrderSelection,
        }}
        columns={columns}
        expandable={{
          expandedRowRender,
          rowExpandable: (record) => record.subOrders && record.subOrders.length > 0,
        }}
        dataSource={orders}
        rowKey="salesOrder"
        loading={loading}
      />
      
      <Form.Item name="truck" label="Select Truck">
        <Select onChange={handleTruckSelection} value={selectedTruck}>
          {availableTrucks.map(truck => (
            <Option key={truck.Vehicle} value={truck.Vehicle}>
              {truck.Vehicle} - Capacity: {truck['Vehicule Capacity']} - Type: {truck['MPGI']}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {selectedTruck && (
        <>
          <Form.Item name="driverCIN" label="Driver CIN">
            <Input 
              value={driverInfo.cin}
              onChange={(e) => handleDriverInfoChange('cin', e.target.value)}
            />
          </Form.Item>
          <Form.Item name="driverName" label="Driver Name">
            <Input 
              value={driverInfo.name}
              onChange={(e) => handleDriverInfoChange('name', e.target.value)}
            />
          </Form.Item>
        </>
      )}

      <Form.Item name="tourStartDate" label="Tour Start Date" rules={[{ required: true, message: 'Please select a tour start date' }]}>
        <DatePicker />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" disabled={calculateTruckUtilization() < 100}>
            Create Trip
          </Button>
          <span>Truck Utilization: {calculateTruckUtilization().toFixed(2)}%</span>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TripCreation;