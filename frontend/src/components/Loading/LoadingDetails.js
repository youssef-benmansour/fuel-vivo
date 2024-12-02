import React, { useState, useEffect } from 'react';
import { Card, Tabs, Descriptions, Table, Button, Input, message, Modal, Spin, Typography, Tag, Alert } from 'antd';
import { getTripById, updateTripLoading, getProducts } from '../../services/api';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const LoadingDetails = ({ tripId, onClose, onLoadingConfirmed }) => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstSealNumber, setFirstSealNumber] = useState('');
  const [products, setProducts] = useState([]);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  useEffect(() => {
    fetchTripDetails();
    fetchProducts();
  }, [tripId]);

  const fetchTripDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching trip details for ID:', tripId);
      const tripData = await getTripById(tripId);
      console.log('Received trip data:', tripData);
      if (!tripData) {
        throw new Error('No trip data received');
      }
      if (!tripData.totalorders || tripData.totalorders.length === 0) {
        throw new Error('No orders found for this trip');
      }
      tripData.Orders = tripData.totalorders;
      setTrip(tripData);
    } catch (error) {
      console.error('Error fetching trip details:', error);
      setError(error.message || 'Failed to fetch trip details');
      message.error('Failed to fetch trip details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products');
    }
  };

  const handleConfirmLoading = async () => {
    if (!trip || !trip.Orders || trip.Orders.length === 0) {
      message.error('No orders found for this trip.');
      return;
    }

    const firstOrder = trip.Orders[0];
    const isVrac = firstOrder.order_type === 'VRAC';

    if (isVrac) {
      if (!firstSealNumber) {
        message.error('Please enter the first seal number for VRAC orders.');
        return;
      }

      const vracProducts = trip.Orders.filter(order => order.order_type === 'VRAC');
      const incompleteProducts = vracProducts.filter(order => {
        const product = products.find(p => p.Material === order['Material Code']);
        return !product || product.density === null || product.temp === null;
      });

      if (incompleteProducts.length > 0) {
        message.error('Some VRAC products are missing density or temperature information.');
        return;
      }
    }

    setConfirmationModalVisible(true);
  };

  const confirmLoading = async () => {
    try {
      if (!trip || !trip.totalorders || trip.totalorders.length === 0) {
        throw new Error('No orders found for this trip.');
      }

      const firstOrder = trip.totalorders[0];
      const isVrac = firstOrder.order_type === 'VRAC';

      if (isVrac && !firstSealNumber) {
        throw new Error('Please enter the first seal number for VRAC orders.');
      }

      let sealNumbers = [];
      if (isVrac) {
        sealNumbers = generateSealNumbers(firstSealNumber, trip.Truck.Seals);
      }

      const updatedTrip = await updateTripLoading(trip.id, {
        Status: 'Completed',
        sealnumbers: sealNumbers
      });

      if (!updatedTrip.totalorders || updatedTrip.totalorders.length === 0) {
        console.warn('Trip updated, but no orders were found or updated.');
      }

      message.success('Loading confirmed successfully');
      onLoadingConfirmed(updatedTrip);
      onClose();
    } catch (error) {
      console.error('Error confirming loading:', error);
      setError(error.message || 'An error occurred while confirming loading');
      message.error('Failed to confirm loading. Please try again.');
    } finally {
      setConfirmationModalVisible(false);
    }
  };

  const generateSealNumbers = (start, count) => {
    const numbers = [];
    let current = parseInt(start, 10);
    for (let i = 0; i < count; i++) {
      numbers.push(current.toString().padStart(4, '0'));
      current++;
    }
    return numbers;
  };

  if (loading) {
    return <Spin size="large" />;
  }

if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        closable
        onClose={() => setError(null)}
      />
    );
  }

  if (!trip || !trip.Orders || trip.Orders.length === 0) {
    return <Text>No trip data or orders available. Please try refreshing the page.</Text>;
  }

  const groupedOrders = trip.Orders.reduce((acc, order) => {
    if (!acc[order['Sales Order']]) {
      acc[order['Sales Order']] = [];
    }
    acc[order['Sales Order']].push(order);
    return acc;
  }, {});

  const orderColumns = [
    { title: 'Material Code', dataIndex: 'Material Code', key: 'materialCode' },
    { title: 'Material Name', dataIndex: 'Material Name', key: 'materialName' },
    { title: 'Quantity', dataIndex: 'Order Qty', key: 'quantity' },
    { title: 'UOM', dataIndex: 'Sls.UOM', key: 'uom' },
    { 
      title: 'Order Type', 
      dataIndex: 'order_type', 
      key: 'orderType',
      render: (type) => (
        <Tag color={type === 'VRAC' ? 'blue' : 'green'}>{type}</Tag>
      )
    },
  ];

  return (
    <Card title={<Title level={4}>Trip Loading Details - Trip Number: {trip['Trip Num']}</Title>}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Trip Information" key="1">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Trip Number">{trip['Trip Num']}</Descriptions.Item>
            <Descriptions.Item label="Tour Start Date">{trip['Tour Start Date']}</Descriptions.Item>
            <Descriptions.Item label="Status">{trip.Status}</Descriptions.Item>
            <Descriptions.Item label="Total Quantity">{trip['Order Qty']}</Descriptions.Item>
          </Descriptions>
        </TabPane>
        <TabPane tab="Truck Information" key="2">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Vehicle">{trip.Truck.Vehicle}</Descriptions.Item>
            <Descriptions.Item label="Driver Name">{trip['Driver Name']}</Descriptions.Item>
            <Descriptions.Item label="Driver CIN">{trip['Driver CIN']}</Descriptions.Item>
            <Descriptions.Item label="Haulier Name">{trip.Truck['Haulier name']}</Descriptions.Item>
            <Descriptions.Item label="Number of Seals">{trip.Truck.Seals}</Descriptions.Item>
            <Descriptions.Item label="MPGI">{trip.Truck.MPGI}</Descriptions.Item>
          </Descriptions>
        </TabPane>
        <TabPane tab="Orders" key="3">
          {Object.entries(groupedOrders).map(([salesOrder, orders]) => (
            <Card key={salesOrder} title={`Sales Order: ${salesOrder}`} style={{ marginBottom: 16 }}>
              <Table 
                dataSource={orders} 
                columns={orderColumns}
                pagination={false}
                rowKey="id"
              />
            </Card>
          ))}
        </TabPane>
      </Tabs>
      
      {trip.Status !== 'Loading Confirmed' && (
        <div style={{ marginTop: 16 }}>
          {trip.Orders[0].order_type === 'VRAC' && (
            <Input
              placeholder="Enter first seal number"
              value={firstSealNumber}
              onChange={(e) => setFirstSealNumber(e.target.value)}
              style={{ width: 200, marginRight: 16 }}
            />
          )}
          <Button type="primary" onClick={handleConfirmLoading}>
            Confirm Loading
          </Button>
        </div>
      )}

      <Modal
        title="Confirm Loading"
        visible={confirmationModalVisible}
        onOk={confirmLoading}
        onCancel={() => setConfirmationModalVisible(false)}
      >
        <p>Are you sure you want to confirm the loading for this trip?</p>
        {trip.Orders[0].order_type === 'VRAC' && (
          <p>Seal numbers will be generated starting from: {firstSealNumber}</p>
        )}
      </Modal>
    </Card>
  );
};

export default LoadingDetails;