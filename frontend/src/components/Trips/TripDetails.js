import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Table, Button, message, Card, Row, Col, Typography, Tabs, Tag, Tooltip, Spin } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, CarOutlined, UserOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getOrdersByTripNum } from '../../services/api';
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const TripDetails = ({ trip, isReadOnly, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(!isReadOnly);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (trip) {
      form.setFieldsValue({
        tripNum: trip['Trip Num'],
        tourStartDate: moment(trip['Tour Start Date']),
        vehicleId: trip['Vehicle Id'],
        status: trip.Status,
      });
      fetchOrders(trip['Trip Num']);
    }
  }, [trip, form]);

  const fetchOrders = async (tripNum) => {
    setOrdersLoading(true);
    try {
      // First, check if orders are already in the trip object
      if (trip.totalorders && trip.totalorders.length > 0) {
        setOrders(trip.totalorders);
      } else {
        // If not, fetch orders from the API
        const data = await getOrdersByTripNum(tripNum);
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to fetch orders for this trip');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const updatedTrip = {
        ...trip,
        ...values,
        'Tour Start Date': values.tourStartDate.format('YYYY-MM-DD'),
      };
      await onSave(updatedTrip);
      message.success('Trip updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating trip:', error);
      message.error('Failed to update trip');
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    { 
      title: 'Sales Order', 
      dataIndex: 'Sales Order', 
      key: 'salesOrder',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    { 
      title: 'Customer', 
      dataIndex: 'Customer Name', 
      key: 'customer',
      render: (text, record) => record.CustomerInfo ? record.CustomerInfo['Customer Sold to name'] : text
    },
    { 
      title: 'Ship To', 
      dataIndex: 'Ship To Name', 
      key: 'shipTo',
      render: (text, record) => record.ShipToInfo ? record.ShipToInfo['Customer ship to name'] : text
    },
    { 
      title: 'Product', 
      dataIndex: 'Material Name', 
      key: 'product',
      render: (text, record) => record.Product ? record.Product['Material description'] : text
    },
    { 
      title: 'Quantity', 
      dataIndex: 'Order Qty', 
      key: 'quantity',
      render: (text, record) => `${text} ${record['Sls.UOM']}`
    },
    { 
      title: 'Order Type', 
      dataIndex: 'order_type', 
      key: 'orderType',
      render: (text) => <Tag color={text === 'PACK' ? 'green' : 'orange'}>{text}</Tag>
    },
  ];

  if (!trip) {
    return <div>No trip data available</div>;
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Trip Details - Trip Number: {trip['Trip Num']}</Title>
          {!isReadOnly && (
            <Button 
              type="primary" 
              icon={editMode ? <SaveOutlined /> : <EditOutlined />} 
              onClick={() => editMode ? form.submit() : setEditMode(true)}
            >
              {editMode ? 'Save' : 'Edit'}
            </Button>
          )}
        </div>
      }
      extra={<Button icon={<CloseOutlined />} onClick={onCancel}>Close</Button>}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Tabs defaultActiveKey="1">
          <TabPane 
            tab={<span><CarOutlined />Trip Information</span>}
            key="1"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tripNum" label="Trip Number">
                  <Input disabled prefix={<FileTextOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="tourStartDate" label="Tour Start Date">
                  <DatePicker 
                    disabled={!editMode} 
                    style={{ width: '100%' }} 
                    prefix={<CalendarOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="vehicleId" label="Vehicle">
                  <Input disabled={!editMode} prefix={<CarOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status">
                  <Select disabled={!editMode}>
                    <Option value="Planned">Planned</Option>
                    <Option value="In Progress">In Progress</Option>
                    <Option value="Completed">Completed</Option>
                    <Option value="Cancelled">Cancelled</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </TabPane>
          <TabPane 
            tab={<span><UserOutlined />Truck Information</span>}
            key="2"
          >
            {trip.Truck && (
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Text strong>Vehicle ID:</Text>
                  <br />
                  <Text>{trip.Truck.Vehicle}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Haulier Name:</Text>
                  <br />
                  <Text>{trip.Truck['Haulier name']}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Driver Name:</Text>
                  <br />
                  <Text>{trip['Driver Name']}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>MPGI:</Text>
                  <br />
                  <Text>{trip.Truck.MPGI}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Vehicle Capacity:</Text>
                  <br />
                  <Text>{trip.Truck['Vehicule Capacity']}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Driver CIN:</Text>
                  <br />
                  <Text>{trip['Driver CIN']}</Text>
                </Col>
              </Row>
            )}
          </TabPane>
          <TabPane 
            tab={<span><FileTextOutlined />Orders</span>}
            key="3"
          >
            {ordersLoading ? (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <Spin size="large" />
                <p>Loading orders...</p>
              </div>
            ) : (
              <Table
                columns={orderColumns}
                dataSource={orders}
                pagination={false}
                rowKey="id"
                scroll={{ x: true }}
              />
            )}
          </TabPane>
        </Tabs>
      </Form>
    </Card>
  );
};

export default TripDetails;