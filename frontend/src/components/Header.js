import React, { useContext } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Switch } from 'antd';
import { UserOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import logo from './logo.png';  // Make sure the logo file is in the same folder

const { Header } = Layout;

const AppHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Item key="2" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logo} alt="Logo" style={{ height: '60px', marginRight: '16px' }} />
        <div style={{ color: 'white' }}>Fuel Delivery Management</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Switch
          checked={theme === 'dark'}
          onChange={toggleTheme}
          checkedChildren="🌙"
          unCheckedChildren="☀️"
          style={{ marginRight: '16px' }}
        />
        {user ? (
          <Dropdown overlay={menu} placement="bottomRight" arrow>
            <Avatar icon={<UserOutlined />} />
          </Dropdown>
        ) : (
          <Button icon={<LoginOutlined />} onClick={() => navigate('/login')}>
            Login
          </Button>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;