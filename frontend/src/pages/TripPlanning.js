import React, { useState, useEffect } from 'react';
import { Card, Tabs } from 'antd';
import TripCreation from '../components/Trips/TripCreation';
import TripList from '../components/Trips/TripList';
import { getOrders, getTrucks } from '../services/api';

const { TabPane } = Tabs;

const TripPlanning = () => {
  const [orders, setOrders] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersResponse, trucksResponse] = await Promise.all([
          getOrders({ status: 'Created' }),
          getTrucks(['id', 'Vehicle', 'MPGI', 'Vehicule Capacity', 'Vehicle-Type', 'Class-Group', 'Haulier name', 'Driver name'])
        ]);
        setOrders(ordersResponse.data);
        setTrucks(trucksResponse.data);
        console.log('Fetched trucks:', trucksResponse.data); // Debug log
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshData = async () => {
    // Implement refresh logic here
  };

  return (
    <Card title="Trip and Route Planning">
      <Tabs defaultActiveKey="1">
        <TabPane tab="Create Trip" key="1">
          <TripCreation orders={orders} trucks={trucks} onTripCreated={refreshData} />
        </TabPane>
        <TabPane tab="Trip List" key="2">
          <TripList onTripUpdated={refreshData} />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default TripPlanning;