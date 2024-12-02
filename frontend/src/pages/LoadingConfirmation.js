import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Tooltip, Card, Tabs, Typography, Empty, Spin } from 'antd';
import { EditOutlined, SaveOutlined, UndoOutlined, InfoCircleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { getProducts, updateProduct, getTrips } from '../services/api';
import LoadingDetails from '../components/Loading/LoadingDetails';
import InvoicePDF from '../components/Loading/InvoicePDF';
import DeliveryNotePDF from '../components/Loading/DeliveryNotePDF';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const LoadingConfirmation = () => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tripsError, setTripsError] = useState(null);
  const [defaultValues, setDefaultValues] = useState({});
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isLoadingDetailsVisible, setIsLoadingDetailsVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalTrips, setTotalTrips] = useState(0);

  const DEFAULT_PRODUCT_VALUES = {
    '31280': { density: 0.7550, temp: 15, type: 'FUEL' },
    '61983': { density: 0.8000, temp: 15, type: 'FUEL' },
    '61988': { density: 0.7550, temp: 15, type: 'FUEL' },
    '81357': { density: 1.0000, temp: 15, type: 'FUEL' },
    '81358': { density: 0.8450, temp: 15, type: 'FUEL' },
    '81359': { density: 0.8450, temp: 15, type: 'FUEL' },
    '81360': { density: 0.8450, temp: 15, type: 'FUEL' },
    '81363': { density: 0.7550, temp: 15, type: 'FUEL' },
    '81364': { density: 0.7134, temp: 15, type: 'FUEL' },
    '30876': { density: 0.5800, temp: 20, type: 'LPG' },
    '81173': { density: 0.5290, temp: 20, type: 'LPG' },
    '12882': { density: 0.8881, temp: 15, type: 'LUBE' },
    '81538': { density: 0.8881, temp: 15, type: 'LUBE' },
    '81539': { density: 0.8881, temp: 15, type: 'LUBE' },
    '81540': { density: 0.8881, temp: 15, type: 'LUBE' },
    '81566': { density: 0.8881, temp: 15, type: 'LUBE' },
    '97901': { density: 0.8881, temp: 15, type: 'LUBE' },
  };

const fetchProducts = async () => {
  try {
    setLoading(true);
    const response = await getProducts();
    const vracProducts = response.data.filter(product => 
      !product['DF at client level'].toLowerCase().includes('pack') && !product['DF at client level'].includes('ADD')
    );
    
    const productsWithDefaults = vracProducts.map(product => ({
      ...product,
      defaultDensity: DEFAULT_PRODUCT_VALUES[product.Material]?.density || product.density,
      defaultTemp: DEFAULT_PRODUCT_VALUES[product.Material]?.temp || product.temp
    }));
    
    setProducts(productsWithDefaults);
  } catch (error) {
    message.error('Failed to fetch products');
  } finally {
    setLoading(false);
  }
};

  const fetchTrips = useCallback(async (page, limit) => {
    try {
      setLoading(true);
      setTripsError(null);
      const response = await getTrips(page, limit);
      setTrips(response.trips);
      setTotalTrips(response.totalCount);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTripsError('Failed to fetch trips. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchTrips(currentPage, pageSize);
  }, [currentPage, pageSize, fetchTrips]);

  const showProductModal = (product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      density: product.density,
      temp: product.temp,
      defaultDensity: product.defaultDensity,
      defaultTemp: product.defaultTemp
    });
    setIsProductModalVisible(true);
  };

  const showLoadingDetails = (tripId) => {
    setSelectedTripId(tripId);
    setIsLoadingDetailsVisible(true);
  };

  const handleProductUpdate = async () => {
    try {
      const values = await form.validateFields();
      const updatedProduct = { 
        ...editingProduct, 
        ...values,
        defaultDensity: editingProduct.defaultDensity,
        defaultTemp: editingProduct.defaultTemp
      };
      await updateProduct(editingProduct.id, {
        density: values.density,
        temp: values.temp
      });
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      message.success('Product updated successfully');
      setIsProductModalVisible(false);
    } catch (error) {
      message.error('Failed to update product');
    }
  };

  const handleResetDefault = () => {
    if (editingProduct) {
      form.setFieldsValue({
        density: editingProduct.defaultDensity,
        temp: editingProduct.defaultTemp
      });
    }
  };

  const handleLoadingConfirmed = () => {
    fetchTrips(currentPage, pageSize);
    setIsLoadingDetailsVisible(false);
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const productColumns = [
    { title: 'Material', dataIndex: 'Material', key: 'Material' },
    { title: 'Description', dataIndex: 'Material description', key: 'Material description', ellipsis: true },
    { title: 'Group', dataIndex: 'Material Group', key: 'Material Group' },
    { 
      title: 'Density', 
      dataIndex: 'density', 
      key: 'density',
      render: (density) => density?.toFixed(4)
    },
    { 
      title: 'Temp', 
      dataIndex: 'temp', 
      key: 'temp',
      render: (temp) => temp?.toFixed(2)
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          icon={<EditOutlined />} 
          onClick={() => showProductModal(record)}
          type="link"
        >
          Edit
        </Button>
      ),
    },
  ];


  const tripColumns = [
    { title: 'Trip Number', dataIndex: 'Trip Num', key: 'tripNum' },
    { title: 'Vehicle', dataIndex: ['Truck', 'Vehicle'], key: 'vehicle' },
    { title: 'Status', dataIndex: 'Status', key: 'status' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <>
          <Button icon={<EyeOutlined />} onClick={() => showLoadingDetails(record['Trip Num'])}>
            View Details
          </Button>
          {record.Status === 'Completed' && (
            <>
              <InvoicePDF trip={record} />
              <DeliveryNotePDF trip={record} />
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <Card title="Loading Confirmation" extra={
      <Tooltip title="Manage product properties and confirm trip loading">
        <InfoCircleOutlined style={{ fontSize: '16px' }} />
      </Tooltip>
    }>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Product Properties" key="1">
          <Table 
            dataSource={products} 
            columns={productColumns} 
            rowKey="Material"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </TabPane>
        <TabPane tab="Trip Loading" key="2">
          {loading ? (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <Spin size="large" />
            </div>
          ) : tripsError ? (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <Text type="danger">{tripsError}</Text>
              <br />
              <Button icon={<ReloadOutlined />} onClick={() => fetchTrips(currentPage, pageSize)} style={{ marginTop: '10px' }}>
                Retry
              </Button>
            </div>
          ) : trips.length === 0 ? (
            <Empty 
              description="No trips found" 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
            >
              <Button type="primary" onClick={() => fetchTrips(currentPage, pageSize)}>Refresh Trips</Button>
            </Empty>
          ) : (
            <Table 
              dataSource={trips} 
              columns={tripColumns} 
              rowKey="Trip Num"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalTrips,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} items`,
              }}
              onChange={handleTableChange}
              size="middle"
            />
          )}
        </TabPane>
      </Tabs>

      <Modal
  title={`Edit ${editingProduct?.['Material description']}`}
  visible={isProductModalVisible}
  onOk={handleProductUpdate}
  onCancel={() => setIsProductModalVisible(false)}
  footer={[
    <Button key="reset" onClick={handleResetDefault} icon={<UndoOutlined />}>
      Reset to Default
    </Button>,
    <Button key="cancel" onClick={() => setIsProductModalVisible(false)}>
      Cancel
    </Button>,
    <Button key="submit" type="primary" onClick={handleProductUpdate} icon={<SaveOutlined />}>
      Save Changes
    </Button>,
  ]}
>
  <Form form={form} layout="vertical">
    <Form.Item
      name="density"
      label="Density"
      rules={[{ required: true, message: 'Please input the density' }]}
    >
      <InputNumber step="0.0001" precision={4} style={{ width: '100%' }} />
    </Form.Item>
    <Form.Item
      name="temp"
      label="Temperature"
      rules={[{ required: true, message: 'Please input the temperature' }]}
    >
      <InputNumber style={{ width: '100%' }} />
    </Form.Item>
    <Form.Item name="defaultDensity" hidden={true}>
      <InputNumber />
    </Form.Item>
    <Form.Item name="defaultTemp" hidden={true}>
      <InputNumber />
    </Form.Item>
  </Form>
</Modal>

      <Modal
        visible={isLoadingDetailsVisible}
        onCancel={() => setIsLoadingDetailsVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose={true}
      >
        <LoadingDetails
          tripId={selectedTripId}
          onClose={() => setIsLoadingDetailsVisible(false)}
          onLoadingConfirmed={handleLoadingConfirmed}
        />
      </Modal>
    </Card>
  );
};

export default LoadingConfirmation;