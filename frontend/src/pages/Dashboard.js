import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, DatePicker, Select, Typography } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Truck, DollarSign, Droplet, Calendar, MapPin } from 'lucide-react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Mock data - replace with actual API calls
  const [orderStats, setOrderStats] = useState({});
  const [deliveryStats, setDeliveryStats] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [productDistribution, setProductDistribution] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [fleetUtilization, setFleetUtilization] = useState(0);

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setOrderStats({
        total: 1250,
        completed: 1100,
        pending: 150,
        growth: 15,
      });
      setDeliveryStats({
        total: 950,
        onTime: 900,
        delayed: 50,
        efficiency: 94.7,
      });
      setRevenueData([
        { name: 'Jan', value: 4000 },
        { name: 'Feb', value: 3000 },
        { name: 'Mar', value: 5000 },
        { name: 'Apr', value: 4500 },
        { name: 'May', value: 6000 },
        { name: 'Jun', value: 5500 },
      ]);
      setProductDistribution([
        { name: 'Gasoline', value: 45 },
        { name: 'Diesel', value: 30 },
        { name: 'Kerosene', value: 15 },
        { name: 'LPG', value: 10 },
      ]);
      setTopClients([
        { name: 'ABC Company', orders: 120, revenue: 250000 },
        { name: 'XYZ Corp', orders: 95, revenue: 200000 },
        { name: '123 Industries', orders: 80, revenue: 180000 },
        { name: 'Best Fuels Ltd', orders: 75, revenue: 160000 },
        { name: 'Green Energy Co', orders: 60, revenue: 130000 },
      ]);
      setFleetUtilization(78);
      setLoading(false);
    }, 1500);
  }, [dateRange, selectedRegion]);

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    setLoading(true);
    // Trigger API calls with new date range
  };

  const handleRegionChange = (value) => {
    setSelectedRegion(value);
    setLoading(true);
    // Trigger API calls with new region
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <Title level={2}>Fuel Delivery Management Dashboard</Title>
        <div className="dashboard-controls">
          <RangePicker onChange={handleDateRangeChange} />
          <Select defaultValue="all" style={{ width: 120 }} onChange={handleRegionChange}>
            <Option value="all">All Regions</Option>
            <Option value="north">North</Option>
            <Option value="south">South</Option>
            <Option value="east">East</Option>
            <Option value="west">West</Option>
          </Select>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={orderStats.total}
              prefix={<Truck size={20} />}
              suffix={
                <span className={`trend-indicator ${orderStats.growth >= 0 ? 'positive' : 'negative'}`}>
                  {orderStats.growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(orderStats.growth)}%
                </span>
              }
              loading={loading}
            />
            <Progress
              percent={(orderStats.completed / orderStats.total) * 100}
              strokeColor="#52c41a"
              format={(percent) => `${percent.toFixed(1)}% Completed`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Delivery Efficiency"
              value={deliveryStats.efficiency}
              precision={1}
              suffix="%"
              prefix={<Calendar size={20} />}
              loading={loading}
            />
            <Progress
              percent={deliveryStats.efficiency}
              strokeColor="#1890ff"
              format={(percent) => `${deliveryStats.onTime} On-time`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Fleet Utilization"
              value={fleetUtilization}
              suffix="%"
              prefix={<Truck size={20} />}
              loading={loading}
            />
            <Progress percent={fleetUtilization} strokeColor="#faad14" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={revenueData.reduce((sum, item) => sum + item.value, 0)}
              prefix={<DollarSign size={20} />}
              loading={loading}
            />
            <div className="revenue-trend">
              <ResponsiveContainer width="100%" height={50}>
                <LineChart data={revenueData}>
                  <Line type="monotone" dataKey="value" stroke="#52c41a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} lg={12}>
          <Card title="Revenue Trend" extra={<MapPin size={16} />}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1890ff" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Product Distribution" extra={<Droplet size={16} />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {productDistribution.map((entry, index) => (
                    <Cell key={`${index}`} fill={['#1890ff', '#52c41a', '#faad14', '#f5222d'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24}>
          <Card title="Top Performing Clients" extra={<DollarSign size={16} />}>
            <Table
              dataSource={topClients}
              columns={[
                { title: 'Client Name', dataIndex: 'name', key: 'name' },
                { title: 'Total Orders', dataIndex: 'orders', key: 'orders' },
                { 
                  title: 'Total Revenue', 
                  dataIndex: 'revenue', 
                  key: 'revenue',
                  render: (value) => `$${value.toLocaleString()}`
                },
              ]}
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .dashboard {
          padding: 24px;
          background: #f0f2f5;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .dashboard-controls {
          display: flex;
          gap: 16px;
        }
        .trend-indicator {
          display: inline-flex;
          align-items: center;
          margin-left: 8px;
          font-size: 14px;
        }
        .trend-indicator.positive {
          color: #52c41a;
        }
        .trend-indicator.negative {
          color: #f5222d;
        }
        .revenue-trend {
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;