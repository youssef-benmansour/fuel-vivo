import React, { useContext } from 'react';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, ShoppingCartOutlined, ImportOutlined, FileTextOutlined, TruckOutlined, CarryOutOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const { Sider } = Layout;

const Sidebar = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  return (
    <Sider width={200} className="site-layout-background">
      <Menu
        mode="inline"
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1']}
        style={{ height: '100%', borderRight: 0 }}
        selectedKeys={[location.pathname]}
      >
        {user ? (
          <>
            <Menu.Item key="/" icon={<DashboardOutlined />}>
              <Link to="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="/import" icon={<ImportOutlined />}>
              <Link to="/import">Data Import</Link>
            </Menu.Item>
            <Menu.Item key="/orders" icon={<ShoppingCartOutlined />}>
              <Link to="/orders">Orders</Link>
            </Menu.Item>
            <Menu.Item key="/trips" icon={<TruckOutlined />}>
              <Link to="/trips">Trips</Link>
            </Menu.Item>
            <Menu.Item key="/loadings" icon={<CarryOutOutlined />}>
              <Link to="/loadings">Loading Confirmation</Link>
            </Menu.Item>
            <Menu.Item key="/reporting" icon={<FileTextOutlined />}>
              <Link to="/reporting">End of Day</Link>
            </Menu.Item>
          </>
        ) : (
          <>
            <Menu.Item key="/login" icon={<UserOutlined />}>
              <Link to="/login">Login</Link>
            </Menu.Item>
            <Menu.Item key="/register" icon={<UserOutlined />}>
              <Link to="/register">Register</Link>
            </Menu.Item>
          </>
        )}
      </Menu>
    </Sider>
  );
};

export default Sidebar;