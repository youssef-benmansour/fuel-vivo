import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AppHeader from './components/Header';
import AppFooter from './components/Footer';
import Dashboard from './pages/Dashboard';
import DataImport from './pages/DataImport';
import OrderManagement from './pages/OrderManagement';
import TripPlanning from './pages/TripPlanning';
import LoadingConfirmation from './pages/LoadingConfirmation';
import Reporting from './pages/Reporting';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

const { Content } = Layout;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Layout style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Layout>
              <Sidebar />
              <Layout style={{ padding: '0 24px 24px' }}>
                <Content
                  className="site-layout-background"
                  style={{
                    padding: 24,
                    margin: 0,
                    minHeight: 280,
                  }}
                >
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/import" element={<ProtectedRoute><DataImport /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />
                    <Route path="/trips" element={<ProtectedRoute><TripPlanning /></ProtectedRoute>} />
                    <Route path="/loadings" element={<ProtectedRoute><LoadingConfirmation /></ProtectedRoute>} />
                    <Route path="/reporting" element={<ProtectedRoute><Reporting /></ProtectedRoute>} />
                    </Routes>
                </Content>
                <AppFooter />
              </Layout>
            </Layout>
          </Layout>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;