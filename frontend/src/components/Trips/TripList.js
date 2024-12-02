import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, message, Space, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getTrips, deleteTrip, getTripDetails, updateTrip } from '../../services/api';
import TripDetails from './TripDetails';
import LoadingSlipPDF from './LoadingSlipPDF';

const TripList = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTrip, setModalTrip] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTrips = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await getTrips(page, pageSize);
      setTrips(response.trips);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.totalCount || 0,
      }));
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to fetch trips. Please try again.');
      message.error('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize, fetchTrips]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleView = async (record) => {
    try {
      const tripDetails = await getTripDetails(record['Trip Num']);
      if (tripDetails) {
        setModalTrip(tripDetails);
        setIsReadOnly(true);
        setIsModalVisible(true);
      } else {
        throw new Error('No trip details returned');
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
      message.error('Failed to fetch trip details');
    }
  };

  const handleEdit = async (record) => {
    try {
      const tripDetails = await getTripDetails(record['Trip Num']);
      if (tripDetails) {
        setModalTrip(tripDetails);
        setIsReadOnly(false);
        setIsModalVisible(true);
      } else {
        throw new Error('No trip details returned');
      }
    } catch (error) {
      console.error('Error fetching trip details for editing:', error);
      message.error('Failed to fetch trip details for editing');
    }
  };

  const handleDelete = async (tripNum) => {
    try {
      await deleteTrip(tripNum);
      message.success('Trip deleted successfully');
      fetchTrips(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting trip:', error);
      message.error('Failed to delete trip');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setModalTrip(null);
  };

  const handleTripUpdate = async (updatedTrip) => {
    try {
      await updateTrip(updatedTrip['Trip Num'], updatedTrip);
      message.success('Trip updated successfully');
      setIsModalVisible(false);
      fetchTrips(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error updating trip:', error);
      message.error('Failed to update trip');
    }
  };

  const columns = [
    { title: 'Trip Number', dataIndex: 'Trip Num', key: 'tripNum', sorter: (a, b) => a['Trip Num'] - b['Trip Num'] },
    { title: 'Tour Start Date', dataIndex: 'Tour Start Date', key: 'tourStartDate', sorter: (a, b) => new Date(a['Tour Start Date']) - new Date(b['Tour Start Date']) },
    { title: 'Vehicle', dataIndex: ['Truck', 'Vehicle'], key: 'vehicleId' },
    { title: 'Total Quantity', dataIndex: 'Order Qty', key: 'orderQty', sorter: (a, b) => a['Order Qty'] - b['Order Qty'] },
    { 
      title: 'Total Orders', 
      dataIndex: 'totalorders', 
      key: 'totalOrders',
      render: (totalorders) => totalorders ? totalorders.length : 0,
      sorter: (a, b) => (a.totalorders ? a.totalorders.length : 0) - (b.totalorders ? b.totalorders.length : 0)
    },
    { 
      title: 'Unique Sales Orders', 
      dataIndex: 'uniquesalesorders', 
      key: 'uniqueSalesOrders',
      render: (uniquesalesorders) => uniquesalesorders ? uniquesalesorders.length : 0,
      sorter: (a, b) => (a.uniquesalesorders ? a.uniquesalesorders.length : 0) - (b.uniquesalesorders ? b.uniquesalesorders.length : 0)
    },
    { 
      title: 'Status', 
      dataIndex: 'Status', 
      key: 'status',
      render: (status) => (
        <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
          {status}
        </span>
      ),
      filters: [
        { text: 'Planned', value: 'Planned' },
        { text: 'In Progress', value: 'In Progress' },
        { text: 'Completed', value: 'Completed' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value, record) => record.Status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this trip?"
            onConfirm={() => handleDelete(record['Trip Num'])}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
          <LoadingSlipPDF tripId={record['Trip Num']} />
        </Space>
      ),
    },
  ];

  return (
    <div className="trip-list">
      <h2>Trip List</h2>
      {error && <div className="error-message">{error}</div>}
      <Table
        columns={columns}
        dataSource={trips}
        loading={loading}
        rowKey="Trip Num"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        onChange={handleTableChange}
      />
        <Modal
          title={isReadOnly ? "View Trip" : "Edit Trip"}
          visible={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
          width={800}
        >
          {modalTrip && (
            <>
              <TripDetails
                trip={modalTrip}
                isReadOnly={isReadOnly}
                onSave={handleTripUpdate}
                onCancel={handleModalCancel}
              />
            </>
          )}
        </Modal>
    </div>
  );
};

export default TripList;