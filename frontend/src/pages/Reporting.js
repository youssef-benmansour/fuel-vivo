import React, { useState, useEffect } from 'react';
import { Card, Button, Table, message, DatePicker, Alert, Space, Typography } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { getOrders } from '../services/api';
import * as XLSX from 'xlsx';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const Reporting = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null,null);

  useEffect(() => {
    fetchOrders();
  }, [dateRange]);

  const fetchOrders = async () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning('Please select a valid date range');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Fetching orders for date range:', dateRange.map(date => date.format('YYYY-MM-DD')));
    
    try {
      const [startDate, endDate] = dateRange;
      const response = await getOrders({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      });
      console.log('API Response:', response);
      
      // Remove duplicates based on order ID
      const uniqueOrders = Array.from(
        new Map(response.data.map(order => [order.id, order])).values()
      );
      
      setOrders(uniqueOrders);
      filterOrders(uniqueOrders);
      console.log('Unique orders set:', uniqueOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(`Failed to fetch orders. Error: ${error.message}`);
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (ordersToFilter = orders) => {
    console.log('Filtering completed orders');
    const filtered = ordersToFilter.filter(order => order.status === 'Completed');
    console.log('Filtered orders:', filtered);
    setFilteredOrders(filtered);
  };

  const columns = [
    { title: 'Item Number', dataIndex: 'Item', key: 'Item' },
    { title: 'Record Identifier', dataIndex: 'id', key: 'id' },
    { title: 'TRIP NUM', dataIndex: 'Trip Num', key: 'Trip Num' },
    { title: 'ITEMCAT', dataIndex: 'Order Type', key: 'Order Type' },
    { title: 'ORDER', dataIndex: 'Sales Order', key: 'Sales Order' },
    { title: 'MATERIAL', dataIndex: 'Material Code', key: 'Material Code' },
    { title: 'QUANTITY', dataIndex: 'Order Qty', key: 'Order Qty' },
    { title: 'PLANT', dataIndex: 'Plant', key: 'Plant' },
    { title: 'VALUATION TYPE', dataIndex: 'Valution Type', key: 'Valution Type' },
    { title: 'VEHICLE', dataIndex: 'Vehicle Id', key: 'Vehicle Id' },
    { title: 'Ville', dataIndex: 'City(Ship To)', key: 'City' },
    { title: 'Date', dataIndex: 'updated_at', key: 'updated_at'},
  ];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredOrders.map(order => ({
        'Item Number': order.Item,
        'Record Identifier': order.id,
        'TRIP NUM': order['Trip Num'],
        'ITEMCAT': order['Order Type'],
        'EXTERNAL TRIP': '',
        'ORDER': order['Sales Order'],
        'numberDRIVER': order.Truck?.['Driver CIN'] ?? '',
        'FWDAGENT': order.Truck?.['Haulier number'] ?? '',
        'MATERIAL': order['Material Code'],
        'DISPATCHER': order.Truck?.['Driver name'] ?? '',
        'QUANTITY': order['Order Qty'],
        'PLANT': order.Plant,
        'UOM': order.Product?.['Base Unit of Measure'] ?? '',
        'SLOC': '',
        'Temp': order.Product?.temp ?? '',
        'Density': order.Product?.density ?? '',
        'DISTANCE': '',
        'UOM_DISTANCE': 'KM',
        'VALUATION TYPE': order['Valution Type'],
        'VEHICLE': order.Truck?.Vehicle ?? '',
        'HANDLING TYPE': 'TAXPAID',
        'POSTING DATE(YYYYMMDD)': moment(order.updatedAt).format('YYYYMMDD'),
        'trailer': order.Truck?.['Trailer Number'] ?? '',
        'Batch': 'TAXPAID',
        'Ville': order['City(Ship To)']
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Completed Orders');
    XLSX.writeFile(workbook, `Completed_Orders_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}.xlsx`);
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>End of Day</Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              console.log('Date range changed:', dates);
              setDateRange(dates);
            }}
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportToExcel}
            disabled={filteredOrders.length === 0}
          >
            Export to Excel
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchOrders}
          >
            Refresh Data
          </Button>
        </Space>
        {error && <Alert message={error} type="error" showIcon />}
        <Text>Total orders: {filteredOrders.length}</Text>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
        />
      </Space>
    </Card>
  );
};

export default Reporting;