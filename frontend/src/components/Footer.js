import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const AppFooter = () => {
  return (
    <Footer style={{ textAlign: 'center' }}>
      Fuel Delivery Management System ©{new Date().getFullYear()} Created by IT SHORE
    </Footer>
  );
};

export default AppFooter;